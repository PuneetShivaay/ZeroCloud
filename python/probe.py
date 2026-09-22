"""
ZeroCloud — hardware capability probe.

Prints a single JSON object describing the local machine, then exits.
Must never raise: always emits valid JSON, degrading fields to null.
See docs/04-ipc-contract.md
"""
import json
import os
import platform
import shutil
import subprocess
import sys


def _cpu_name() -> str:
    if platform.system() == "Windows":
        return os.environ.get("PROCESSOR_IDENTIFIER", platform.processor()) or "Unknown CPU"
    return platform.processor() or platform.machine() or "Unknown CPU"


def _ram_gb():
    try:
        if hasattr(os, "sysconf") and "SC_PAGE_SIZE" in os.sysconf_names:
            return round(os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES") / 1024**3, 1)
    except Exception:
        pass
    try:
        import ctypes

        class MemStatus(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        stat = MemStatus()
        stat.dwLength = ctypes.sizeof(MemStatus)
        ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
        return round(stat.ullTotalPhys / 1024**3, 1)
    except Exception:
        return None


def _nvidia_gpus():
    """Query nvidia-smi. Absence simply means no NVIDIA driver."""
    if not shutil.which("nvidia-smi"):
        return []
    try:
        out = subprocess.run(
            ["nvidia-smi",
             "--query-gpu=name,driver_version,memory.total",
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10, check=True,
        ).stdout
    except Exception:
        return []

    gpus = []
    for line in out.strip().splitlines():
        parts = [p.strip() for p in line.split(",")]
        if len(parts) >= 3:
            try:
                vram = round(float(parts[2]) / 1024, 1)
            except ValueError:
                vram = None
            gpus.append({"vendor": "nvidia", "name": parts[0],
                         "driver": parts[1], "vramGB": vram})
    return gpus


def _windows_gpus():
    if platform.system() != "Windows":
        return []
    try:
        out = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "Get-CimInstance Win32_VideoController | "
             "Select-Object Name,DriverVersion,AdapterRAM | ConvertTo-Json -Compress"],
            capture_output=True, text=True, timeout=15, check=True,
        ).stdout.strip()
        data = json.loads(out) if out else []
        if isinstance(data, dict):
            data = [data]
    except Exception:
        return []

    gpus = []
    for item in data:
        name = item.get("Name") or "Unknown GPU"
        lowered = name.lower()
        vendor = ("nvidia" if "nvidia" in lowered or "geforce" in lowered or "rtx" in lowered
                  else "amd" if "amd" in lowered or "radeon" in lowered
                  else "intel" if "intel" in lowered
                  else "unknown")
        ram = item.get("AdapterRAM")
        gpus.append({
            "vendor": vendor,
            "name": name,
            "driver": item.get("DriverVersion"),
            "vramGB": round(ram / 1024**3, 1) if isinstance(ram, int) and ram > 0 else None,
        })
    return gpus


def _torch_info():
    try:
        import torch
    except Exception:
        return {"installed": False, "version": None,
                "cuda": False, "mps": False, "rocm": False}

    cuda = bool(getattr(torch, "cuda", None) and torch.cuda.is_available())
    mps = bool(getattr(getattr(torch, "backends", None), "mps", None)
               and torch.backends.mps.is_available())
    return {
        "installed": True,
        "version": torch.__version__,
        "cuda": cuda,
        "mps": mps,
        "rocm": bool(getattr(torch.version, "hip", None)),
        "cudaVersion": getattr(torch.version, "cuda", None),
        "deviceCount": torch.cuda.device_count() if cuda else 0,
    }


def main():
    torch_info = _torch_info()

    gpus = _nvidia_gpus()
    if not gpus:
        gpus = _windows_gpus()

    if torch_info["cuda"]:
        recommended = "cuda"
    elif torch_info["mps"]:
        recommended = "mps"
    else:
        recommended = "cpu"

    info = {
        "os": sys.platform,
        "osRelease": platform.platform(),
        "arch": platform.machine(),
        "python": {
            "version": platform.python_version(),
            "executable": sys.executable,
        },
        "cpu": {
            "model": _cpu_name(),
            "threads": os.cpu_count(),
        },
        "ram": {"totalGB": _ram_gb()},
        "gpus": gpus,
        "torch": torch_info,
        "recommendedDevice": recommended,
    }
    print(json.dumps(info))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # never emit non-JSON on stdout
        print(json.dumps({"error": str(exc), "recommendedDevice": "cpu",
                          "gpus": [], "torch": {"installed": False}}))
