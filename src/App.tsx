/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  FolderOpen,
  Activity,
  Sliders,
  Calculator as CalcIcon,
  FileText,
  Cpu,
  HardDrive,
  Wifi,
  BatteryCharging,
  Sparkles,
  Play,
  Trash2,
  Plus,
  Search,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Layers,
  Maximize2,
  Minimize2,
  X,
  RefreshCw,
  Code2,
  Copy,
  Check,
  Shield,
  Flame,
  LayoutGrid,
  Volume2,
  Sun,
  Eye,
  Save,
  Folder,
  FileCode,
  ArrowUpRight,
} from 'lucide-react';

// ============================================================================
// SECTION 1: KERNEL TYPES & SYSTEM ARCHITECTURE DEFINITIONS
// ============================================================================

type AppId = 'console' | 'finder' | 'monitor' | 'settings' | 'utility';

type ThemeProfileId = 'silver' | 'cyberpunk' | 'amethyst';

interface ThemeProfile {
  id: ThemeProfileId;
  name: string;
  subtitle: string;
  windowBg: string;
  windowHeaderBg: string;
  sidebarBg: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  terminalText: string;
  badgeBg: string;
  dockBg: string;
}

interface WallpaperOption {
  id: string;
  name: string;
  category: string;
  cssBackground: string;
  overlayMesh: string;
}

interface KernelProcess {
  pid: number;
  name: string;
  appId?: AppId;
  category: 'kernel' | 'daemon' | 'app' | 'worker';
  status: 'running' | 'sleeping' | 'high-load';
  memoryMB: number;
  cpuPct: number;
  ticks: number;
  threads: number;
  flags: string;
}

interface VfsFile {
  name: string;
  path: string;
  parentDir: string;
  sizeBytes: number;
  permissions: string;
  inode: number;
  updatedAt: string;
  type: 'code' | 'config' | 'binary' | 'markdown' | 'log';
  description: string;
  content: string;
}

interface DynamicIslandAlert {
  id: string;
  type: 'spawn' | 'kill' | 'spike' | 'vfs' | 'theme' | 'system';
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string;
  timestamp: string;
  severity: 'normal' | 'warning' | 'critical';
}

interface WindowState {
  id: AppId;
  title: string;
  subtitle: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConsoleLine {
  id: string;
  type: 'input' | 'output' | 'ascii' | 'error' | 'table';
  text: string;
}

// ============================================================================
// SECTION 2: THEME PROFILES, WALLPAPERS & INITIAL VFS DISK ARRAY
// ============================================================================

const THEME_PROFILES: Record<ThemeProfileId, ThemeProfile> = {
  silver: {
    id: 'silver',
    name: 'Mac Classic Silver',
    subtitle: 'Crisp studio frost glass with neutral titanium highlights',
    windowBg: 'rgba(18, 22, 31, 0.75)',
    windowHeaderBg: 'rgba(28, 34, 46, 0.82)',
    sidebarBg: 'rgba(12, 15, 22, 0.62)',
    accentText: 'text-sky-400',
    accentBg: 'bg-sky-500',
    accentBorder: 'border-sky-400/40',
    terminalText: 'text-emerald-300',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    dockBg: 'rgba(22, 27, 38, 0.68)',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    subtitle: 'High-contrast obsidian matrix with electric cyan & ember telemetry',
    windowBg: 'rgba(8, 10, 18, 0.82)',
    windowHeaderBg: 'rgba(15, 19, 34, 0.88)',
    sidebarBg: 'rgba(5, 7, 14, 0.72)',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500',
    accentBorder: 'border-cyan-400/50',
    terminalText: 'text-cyan-300',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
    dockBg: 'rgba(10, 14, 26, 0.76)',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Deep Amethyst Glass',
    subtitle: 'Royal violet spatial layers with warm ember-rose specular edges',
    windowBg: 'rgba(21, 14, 34, 0.76)',
    windowHeaderBg: 'rgba(33, 21, 52, 0.84)',
    sidebarBg: 'rgba(14, 9, 24, 0.66)',
    accentText: 'text-fuchsia-400',
    accentBg: 'bg-fuchsia-500',
    accentBorder: 'border-fuchsia-400/40',
    terminalText: 'text-fuchsia-300',
    badgeBg: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30',
    dockBg: 'rgba(26, 16, 42, 0.72)',
  },
};

const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'ember-horizon',
    name: 'Ember Sequoia Horizon',
    category: 'Dynamic Mesh',
    cssBackground:
      'radial-gradient(circle at 18% 22%, rgba(249, 115, 22, 0.42) 0%, transparent 45%), radial-gradient(circle at 82% 28%, rgba(56, 189, 248, 0.35) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.32) 0%, transparent 55%), linear-gradient(135deg, #06080f 0%, #0f172a 50%, #090b12 100%)',
    overlayMesh:
      'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 32px)',
  },
  {
    id: 'midnight-tahoe',
    name: 'Midnight Cupertino',
    category: 'Spatial Dark',
    cssBackground:
      'radial-gradient(circle at 25% 15%, rgba(37, 99, 235, 0.48) 0%, transparent 52%), radial-gradient(circle at 75% 75%, rgba(14, 165, 233, 0.34) 0%, transparent 50%), radial-gradient(circle at 50% 45%, rgba(30, 58, 138, 0.4) 0%, transparent 60%), linear-gradient(160deg, #030712 0%, #0b132b 55%, #050814 100%)',
    overlayMesh:
      'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)',
  },
  {
    id: 'cyber-grid',
    name: 'Neo-Tokyo Kernel Grid',
    category: 'Synth Architecture',
    cssBackground:
      'radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.42) 0%, transparent 45%), radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.38) 0%, transparent 48%), linear-gradient(145deg, #04060c 0%, #090d1e 50%, #12081c 100%)',
    overlayMesh:
      'linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(236, 72, 153, 0.05) 1px, transparent 1px)',
  },
  {
    id: 'amethyst-nebula',
    name: 'Amethyst Quartz Nebula',
    category: 'Deep Glass',
    cssBackground:
      'radial-gradient(circle at 30% 30%, rgba(192, 38, 211, 0.4) 0%, transparent 48%), radial-gradient(circle at 72% 65%, rgba(124, 58, 237, 0.42) 0%, transparent 52%), radial-gradient(circle at 50% 15%, rgba(244, 63, 94, 0.25) 0%, transparent 45%), linear-gradient(135deg, #090514 0%, #160b2e 50%, #07040d 100%)',
    overlayMesh:
      'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.05) 0%, transparent 45%)',
  },
  {
    id: 'titanium-studio',
    name: 'Studio Pro Titanium',
    category: 'Minimalist Monochrome',
    cssBackground:
      'radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.28) 0%, transparent 55%), radial-gradient(circle at 15% 75%, rgba(71, 85, 105, 0.35) 0%, transparent 50%), linear-gradient(160deg, #090b10 0%, #181c24 50%, #0b0e14 100%)',
    overlayMesh:
      'repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 2px, transparent 2px, transparent 12px)',
  },
  {
    id: 'emerald-aurora',
    name: 'Nordic Kernel Borealis',
    category: 'Atmospheric',
    cssBackground:
      'radial-gradient(circle at 20% 25%, rgba(16, 185, 129, 0.36) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(14, 165, 233, 0.34) 0%, transparent 50%), linear-gradient(150deg, #040d0c 0%, #07191e 52%, #04080e 100%)',
    overlayMesh:
      'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
  },
];

const DIRECTORIES = [
  '/root',
  '/bin',
  '/kernel/core',
  '/drivers/video',
  '/user/desktop',
];

const INITIAL_VFS_FILES: VfsFile[] = [
  // /root
  {
    name: 'boot.cfg',
    path: '/root/boot.cfg',
    parentDir: '/root',
    sizeBytes: 2048,
    permissions: '-rw-r--r--',
    inode: 1001,
    updatedAt: '2026-10-31 03:00',
    type: 'config',
    description: 'Primary bootloader configuration and ring-0 kernel parameters.',
    content: `[BOOTLOADER_EMBER_V4]\nkernel_image = "/kernel/core/scheduler.c"\ninitrd = "/kernel/core/memory_pager.rs"\nvga_mode = "x11_vnc_compositor_rgba64"\ndynamic_island_ipc = enabled\nmax_threads = 256\nsecurity_enclave = "STRICT_RING0"`,
  },
  {
    name: 'ember_manifest.toml',
    path: '/root/ember_manifest.toml',
    parentDir: '/root',
    sizeBytes: 3412,
    permissions: '-rw-r--r--',
    inode: 1002,
    updatedAt: '2026-10-31 03:05',
    type: 'config',
    description: 'System package manifest and subsystem verification signatures.',
    content: `[system]\nos_name = "Ember OS"\nversion = "4.8.2-sequoia-kern"\narch = "arm64_x86_hybrid"\n\n[compositor]\nbackdrop_blur_default = "24px"\nframe_pacing = "120hz_adaptive"\ntraffic_lights = "macos_native"`,
  },
  {
    name: 'security_enclave.pem',
    path: '/root/security_enclave.pem',
    parentDir: '/root',
    sizeBytes: 4096,
    permissions: '-r--------',
    inode: 1003,
    updatedAt: '2026-10-31 02:54',
    type: 'binary',
    description: 'Hardware-backed cryptographic root certificate for VFS signing.',
    content: `-----BEGIN EMBER KERNEL TRUST KEY-----\nMIIEpAIBAAKCAQEAy8Dbv8prpJ/0kKhlGeJYozo2t60EG8L0561g13R29LvMR5hy\nvGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+vw1HocOAZtWK0z3r26uA8kQYOKX9\n-----END EMBER KERNEL TRUST KEY-----`,
  },

  // /bin
  {
    name: 'esh',
    path: '/bin/esh',
    parentDir: '/bin',
    sizeBytes: 65536,
    permissions: '-rwxr-xr-x',
    inode: 2001,
    updatedAt: '2026-10-31 03:10',
    type: 'binary',
    description: 'Ember Shell (esh) interactive command interpreter and AST parser.',
    content: `ELF 64-bit LSB pie executable, Ember-Mach-O, version 1 (SYSV), dynamically linked\nEntry point: 0x100004a20\nBuilt-in routines: help, neofetch, ps, kill, ls, cat, touch, spawn, stress, purge, clear`,
  },
  {
    name: 'neofetch',
    path: '/bin/neofetch',
    parentDir: '/bin',
    sizeBytes: 18432,
    permissions: '-rwxr-xr-x',
    inode: 2002,
    updatedAt: '2026-10-31 03:10',
    type: 'binary',
    description: 'System hardware & kernel telemetry ASCII reporter.',
    content: `#!/bin/esh\n# Queries /kernel/core/scheduler.c and /drivers/video/glass_shader.glsl\n# Outputs Ember OS ASCII insignia and live VFS/RAM allocation metrics.`,
  },
  {
    name: 'ps',
    path: '/bin/ps',
    parentDir: '/bin',
    sizeBytes: 14200,
    permissions: '-rwxr-xr-x',
    inode: 2003,
    updatedAt: '2026-10-31 03:10',
    type: 'binary',
    description: 'Process status snapshot utility reading real-time scheduler queues.',
    content: `BINARY_EXECUTABLE: /bin/ps\nReads active task_struct list from ring-0 micro-scheduler.`,
  },
  {
    name: 'kill',
    path: '/bin/kill',
    parentDir: '/bin',
    sizeBytes: 9840,
    permissions: '-rwxr-xr-x',
    inode: 2004,
    updatedAt: '2026-10-31 03:10',
    type: 'binary',
    description: 'Dispatches SIGTERM/SIGKILL signals to target PIDs and notifies Dynamic Island.',
    content: `BINARY_EXECUTABLE: /bin/kill\nUsage: kill <pid>\nSends IPC interrupt to Dynamic Island HUD upon process termination.`,
  },

  // /kernel/core
  {
    name: 'scheduler.c',
    path: '/kernel/core/scheduler.c',
    parentDir: '/kernel/core',
    sizeBytes: 28940,
    permissions: '-rw-r--r--',
    inode: 3001,
    updatedAt: '2026-10-31 03:12',
    type: 'code',
    description: 'Preemptive fair-share micro-scheduler managing ring-0 and user-space PIDs.',
    content: `// Ember OS Preemptive Micro-Scheduler (kernel/core/scheduler.c)\n#include <ember/sched.h>\n#include <ember/island_ipc.h>\n\nvoid schedule_tick(struct task_queue *q) {\n    for (int i = 0; i < q->count; i++) {\n        struct task_struct *p = q->tasks[i];\n        p->runtime_ticks += 1;\n        p->cpu_pct = compute_ewma_load(p);\n        if (p->cpu_pct > 80) {\n            island_emit_alert(ISLAND_WARN_SPIKE, p->pid);\n        }\n    }\n}`,
  },
  {
    name: 'memory_pager.rs',
    path: '/kernel/core/memory_pager.rs',
    parentDir: '/kernel/core',
    sizeBytes: 19420,
    permissions: '-rw-r--r--',
    inode: 3002,
    updatedAt: '2026-10-31 03:14',
    type: 'code',
    description: 'Virtual memory slab allocator and page cache compression engine.',
    content: `// Ember OS Virtual Memory Pager (kernel/core/memory_pager.rs)\npub struct SlabAllocator {\n    pub total_pages: usize,\n    pub wired_mb: usize,\n    pub active_mb: usize,\n    pub cached_pages: usize,\n}\n\nimpl SlabAllocator {\n    pub fn purge_inactive_pages(&mut self) -> usize {\n        let reclaimed = self.cached_pages / 3;\n        self.cached_pages -= reclaimed;\n        reclaimed\n    }\n}`,
  },
  {
    name: 'ipc_island.c',
    path: '/kernel/core/ipc_island.c',
    parentDir: '/kernel/core',
    sizeBytes: 12180,
    permissions: '-rw-r--r--',
    inode: 3003,
    updatedAt: '2026-10-31 03:15',
    type: 'code',
    description: 'Zero-copy ring buffer driving the top Menu Bar Dynamic Island state transitions.',
    content: `// Dynamic Island IPC Bridge (kernel/core/ipc_island.c)\nint island_dispatch_event(uint32_t pid, const char *event_label, uint8_t severity) {\n    struct island_packet pkt = {\n        .pid = pid,\n        .severity = severity,\n        .morph_duration_ms = 300\n    };\n    return ringbuf_push(&global_island_channel, &pkt);\n}`,
  },

  // /drivers/video
  {
    name: 'glass_shader.glsl',
    path: '/drivers/video/glass_shader.glsl',
    parentDir: '/drivers/video',
    sizeBytes: 8420,
    permissions: '-rw-r--r--',
    inode: 4001,
    updatedAt: '2026-10-31 03:16',
    type: 'code',
    description: 'Multi-pass Gaussian blur and specular border fragment shader.',
    content: `#version 450 core\nuniform float u_backdropBlurPx;\nuniform vec4 u_specularBorder;\nout vec4 FragColor;\n\nvoid main() {\n    // Samples underlying wallpaper & window buffers with 24px radius\n    vec4 refracted = sample_gaussian_pyramid(gl_FragCoord.xy, u_backdropBlurPx);\n    FragColor = mix(refracted, u_specularBorder, 0.18);\n}`,
  },
  {
    name: 'x11_vnc_bridge.drv',
    path: '/drivers/video/x11_vnc_bridge.drv',
    parentDir: '/drivers/video',
    sizeBytes: 15600,
    permissions: '-rwxr-xr-x',
    inode: 4002,
    updatedAt: '2026-10-31 03:16',
    type: 'config',
    description: 'Touch-to-pointer translation layer optimized for mobile X11/VNC viewports.',
    content: `[X11_VNC_DISPLAY_DRIVER]\ntouch_inert_drag = true\nviewport_scaling = "adaptive_fluid"\nhardware_cursor_accel = enabled\ncolor_depth = 32`,
  },

  // /user/desktop
  {
    name: 'welcome_ember.md',
    path: '/user/desktop/welcome_ember.md',
    parentDir: '/user/desktop',
    sizeBytes: 2890,
    permissions: '-rw-rw-r--',
    inode: 5001,
    updatedAt: '2026-10-31 03:18',
    type: 'markdown',
    description: 'Executive overview of the Ember OS workspace and kernel features.',
    content: `# Welcome to Ember OS v4.8 (Sequoia Kernel)\n\nEmber OS is a complete glassmorphic desktop operating system environment engineered with:\n\n1. **Adaptive Dynamic Island**: Centered in the top Global Menu Bar. Click it at any time or launch/kill processes to inspect real-time kernel telemetry.\n2. **Preemptive Micro-Scheduler**: Live PID tracking, CPU/RAM load synthesis, and hardware spike alerts.\n3. **Persistent Virtual File System (VFS)**: Navigate /root, /bin, /kernel/core, /drivers/video, and /user/desktop.\n4. **Live Re-Theming Engine**: Switch themes and adjust backdrop-filter blur in real time.`,
  },
  {
    name: 'architecture_notes.txt',
    path: '/user/desktop/architecture_notes.txt',
    parentDir: '/user/desktop',
    sizeBytes: 1920,
    permissions: '-rw-rw-r--',
    inode: 5002,
    updatedAt: '2026-10-31 03:19',
    type: 'markdown',
    description: 'Systems engineering notes synced directly with the Utility Shelf Notes app.',
    content: `KERNEL ENGINEERING LOG — EMBER OS\n=================================\n- Try running 'neofetch', 'ps', and 'kill <pid>' inside the Kernel System Console.\n- Open Performance Dispatcher to trigger a Hardware Spike or terminate active processes.\n- Edits made in the Utility Shelf Notes Editor are persisted directly into /user/desktop!`,
  },
];

const INITIAL_PROCESSES: KernelProcess[] = [
  {
    pid: 1,
    name: 'ember_kernel_core',
    category: 'kernel',
    status: 'running',
    memoryMB: 312,
    cpuPct: 3.4,
    ticks: 14820,
    threads: 24,
    flags: '0x0001 RING0_SCHED',
  },
  {
    pid: 104,
    name: 'dynamic_island_ipc',
    category: 'daemon',
    status: 'running',
    memoryMB: 96,
    cpuPct: 1.8,
    ticks: 14790,
    threads: 6,
    flags: '0x0040 HUD_COMPOSITOR',
  },
  {
    pid: 118,
    name: 'quartz_glass_srv',
    category: 'daemon',
    status: 'running',
    memoryMB: 428,
    cpuPct: 6.2,
    ticks: 14750,
    threads: 16,
    flags: '0x0110 GLSL_BLUR_24PX',
  },
  {
    pid: 142,
    name: 'vfs_nvme_journal',
    category: 'daemon',
    status: 'running',
    memoryMB: 124,
    cpuPct: 0.9,
    ticks: 14680,
    threads: 8,
    flags: '0x0082 VFS_PERSIST',
  },
  {
    pid: 210,
    name: 'esh_console.app',
    appId: 'console',
    category: 'app',
    status: 'running',
    memoryMB: 186,
    cpuPct: 4.1,
    ticks: 840,
    threads: 8,
    flags: '0x0200 TTY_INTERACTIVE',
  },
  {
    pid: 224,
    name: 'file_navigator.app',
    appId: 'finder',
    category: 'app',
    status: 'running',
    memoryMB: 214,
    cpuPct: 2.5,
    ticks: 790,
    threads: 10,
    flags: '0x0204 VFS_EXPLORER',
  },
  {
    pid: 238,
    name: 'perf_dispatcher.app',
    appId: 'monitor',
    category: 'app',
    status: 'running',
    memoryMB: 248,
    cpuPct: 5.8,
    ticks: 710,
    threads: 12,
    flags: '0x0208 TELEMETRY_POLL',
  },
];

const APP_METADATA: Record<
  AppId,
  {
    title: string;
    shortName: string;
    subtitle: string;
    procName: string;
    baseMemMB: number;
    flags: string;
    gradient: string;
  }
> = {
  console: {
    title: 'Kernel System Console',
    shortName: 'Console',
    subtitle: '/bin/esh — Ring-0 Interactive Telemetry Shell',
    procName: 'esh_console.app',
    baseMemMB: 186,
    flags: '0x0200 TTY_INTERACTIVE',
    gradient: 'from-slate-800 via-slate-900 to-black border-emerald-500/40',
  },
  finder: {
    title: 'Graphical File Navigator',
    shortName: 'Navigator',
    subtitle: 'Stateful Virtual Disk Array Explorer',
    procName: 'file_navigator.app',
    baseMemMB: 214,
    flags: '0x0204 VFS_EXPLORER',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700 border-sky-300/40',
  },
  monitor: {
    title: 'Performance Dispatcher',
    shortName: 'Monitor',
    subtitle: 'Live Hardware Polling & Scheduler Task Control',
    procName: 'perf_dispatcher.app',
    baseMemMB: 248,
    flags: '0x0208 TELEMETRY_POLL',
    gradient: 'from-emerald-500 via-teal-600 to-slate-900 border-emerald-300/40',
  },
  settings: {
    title: 'UI Re-Theming Engine',
    shortName: 'Settings',
    subtitle: 'Glassmorphism Core, Themes & Spatial Wallpapers',
    procName: 'system_settings.app',
    baseMemMB: 172,
    flags: '0x0212 COMPOSITOR_CFG',
    gradient: 'from-orange-500 via-rose-600 to-purple-700 border-orange-300/40',
  },
  utility: {
    title: 'Utility Application Shelf',
    shortName: 'Utilities',
    subtitle: 'Precision Calculator & Persistent VFS Notes Stack',
    procName: 'utility_shelf.app',
    baseMemMB: 164,
    flags: '0x0216 USER_WORKSPACE',
    gradient: 'from-amber-500 via-orange-600 to-red-700 border-amber-300/40',
  },
};

// ============================================================================
// SECTION 3: MAIN EMBER OS WORKSPACE COMPONENT
// ============================================================================

export default function App() {
  // --- Theme & Visual Customization State ---
  const [themeId, setThemeId] = useState<ThemeProfileId>('silver');
  const [wallpaperId, setWallpaperId] = useState<string>('ember-horizon');
  const [blurIntensity, setBlurIntensity] = useState<number>(24);
  const [glassOpacity, setGlassOpacity] = useState<number>(78);
  const [displayBrightness, setDisplayBrightness] = useState<number>(100);

  const activeTheme = THEME_PROFILES[themeId];
  const activeWallpaper = useMemo(
    () => WALLPAPERS.find((w) => w.id === wallpaperId) || WALLPAPERS[0],
    [wallpaperId]
  );

  // Sync CSS variable for backdrop blur
  useEffect(() => {
    document.documentElement.style.setProperty('--ember-blur', `${blurIntensity}px`);
  }, [blurIntensity]);

  // --- Simulated Kernel Process Scheduler & Hardware State ---
  const [processes, setProcesses] = useState<KernelProcess[]>(INITIAL_PROCESSES);
  const [nextPid, setNextPid] = useState<number>(304);
  const [hardwareSpikeMode, setHardwareSpikeMode] = useState<boolean>(false);
  const [cpuCores, setCpuCores] = useState<number[]>([18, 24, 15, 29, 12, 19, 14, 21]);
  const [cachePages, setCachePages] = useState<number>(48920);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(14280);

  // --- Dynamic Island State Machine ---
  const [islandExpanded, setIslandExpanded] = useState<boolean>(false);
  const [islandAlert, setIslandAlert] = useState<DynamicIslandAlert | null>(null);
  const islandTimeoutRef = useRef<number | null>(null);

  const triggerIslandAlert = useCallback(
    (
      type: DynamicIslandAlert['type'],
      title: string,
      subtitle: string,
      metricLabel: string,
      metricValue: string,
      severity: DynamicIslandAlert['severity'] = 'normal'
    ) => {
      const now = new Date();
      const timestamp = now.toTimeString().slice(0, 8);
      setIslandAlert({
        id: `${Date.now()}-${Math.random()}`,
        type,
        title,
        subtitle,
        metricLabel,
        metricValue,
        timestamp,
        severity,
      });
      setIslandExpanded(true);

      if (islandTimeoutRef.current) {
        window.clearTimeout(islandTimeoutRef.current);
      }
      islandTimeoutRef.current = window.setTimeout(() => {
        setIslandExpanded(false);
      }, 4200);
    },
    []
  );

  // --- Persistent Virtual File System (VFS) ---
  const [vfsFiles, setVfsFiles] = useState<VfsFile[]>(() => {
    try {
      const saved = localStorage.getItem('ember_os_vfs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial VFS
    }
    return INITIAL_VFS_FILES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ember_os_vfs_v1', JSON.stringify(vfsFiles));
    } catch {
      // Ignore storage quota errors
    }
  }, [vfsFiles]);

  // --- Window Management State ---
  const [focusedApp, setFocusedApp] = useState<AppId>('console');
  const [topZIndex, setTopZIndex] = useState<number>(30);
  const [windows, setWindows] = useState<Record<AppId, WindowState>>(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isCompact = vw < 900;

    return {
      console: {
        id: 'console',
        title: APP_METADATA.console.title,
        subtitle: APP_METADATA.console.subtitle,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 28,
        x: isCompact ? 12 : 48,
        y: isCompact ? 52 : 62,
        width: isCompact ? Math.min(vw - 24, 620) : 640,
        height: isCompact ? Math.min(vh - 150, 430) : 440,
      },
      finder: {
        id: 'finder',
        title: APP_METADATA.finder.title,
        subtitle: APP_METADATA.finder.subtitle,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 26,
        x: isCompact ? 20 : Math.max(120, vw - 760),
        y: isCompact ? 76 : 84,
        width: isCompact ? Math.min(vw - 32, 660) : 700,
        height: isCompact ? Math.min(vh - 160, 440) : 450,
      },
      monitor: {
        id: 'monitor',
        title: APP_METADATA.monitor.title,
        subtitle: APP_METADATA.monitor.subtitle,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        zIndex: 24,
        x: isCompact ? 16 : Math.max(80, Math.floor(vw * 0.24)),
        y: isCompact ? 96 : Math.max(110, vh - 540),
        width: isCompact ? Math.min(vw - 28, 650) : 680,
        height: isCompact ? Math.min(vh - 160, 430) : 430,
      },
      settings: {
        id: 'settings',
        title: APP_METADATA.settings.title,
        subtitle: APP_METADATA.settings.subtitle,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 20,
        x: isCompact ? 14 : 180,
        y: isCompact ? 64 : 90,
        width: isCompact ? Math.min(vw - 28, 640) : 680,
        height: isCompact ? Math.min(vh - 150, 460) : 470,
      },
      utility: {
        id: 'utility',
        title: APP_METADATA.utility.title,
        subtitle: APP_METADATA.utility.subtitle,
        isOpen: false,
        isMinimized: false,
        isMaximized: false,
        zIndex: 18,
        x: isCompact ? 18 : 240,
        y: isCompact ? 72 : 96,
        width: isCompact ? Math.min(vw - 32, 660) : 720,
        height: isCompact ? Math.min(vh - 150, 460) : 470,
      },
    };
  });

  // --- Menu Bar & Control Center Dropdown States ---
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [controlCenterOpen, setControlCenterOpen] = useState<boolean>(false);
  const [dockHoveredApp, setDockHoveredApp] = useState<AppId | null>(null);
  const [clockString, setClockString] = useState<string>('');
  const [standaloneModalOpen, setStandaloneModalOpen] = useState<boolean>(false);
  const [copiedStandalone, setCopiedStandalone] = useState<boolean>(false);

  // --- App-Specific States ---
  // 1. Finder State
  const [selectedDir, setSelectedDir] = useState<string>('/kernel/core');
  const [selectedFilePath, setSelectedFilePath] = useState<string>('/kernel/core/scheduler.c');
  const [finderSearch, setFinderSearch] = useState<string>('');

  // 2. Utility Shelf State (Calculator + Persistent Notes)
  const [utilityTab, setUtilityTab] = useState<'notes' | 'calculator'>('notes');
  const [activeNotePath, setActiveNotePath] = useState<string>('/user/desktop/architecture_notes.txt');
  const [newNoteName, setNewNoteName] = useState<string>('');
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcEquation, setCalcEquation] = useState<string>('');
  const [calcHistory, setCalcHistory] = useState<string[]>([
    '1024 * 16 = 16384',
    '256 / 8 = 32',
  ]);

  // 3. Console State
  const [consoleInput, setConsoleInput] = useState<string>('');
  const [consoleHistory, setConsoleHistory] = useState<ConsoleLine[]>([
    {
      id: 'init-1',
      type: 'ascii',
      text: `   ______          __               ____  _____
  / ____/___ ___  / /_  ___  _____ / __ \\/ ___/
 / __/ / __ \`__ \\/ __ \\/ _ \\/ ___// / / /\\__ \\ 
/ /___/ / / / / / /_/ /  __/ /   / /_/ /___/ / 
\\____/_/ /_/ /_/_.___/\\___/_/    \\____//____/  v4.8.2-sequoia`,
    },
    {
      id: 'init-2',
      type: 'output',
      text: `Ember OS Ring-0 Kernel Shell (/bin/esh) initialized. Type 'help', 'neofetch', 'ps', or 'kill <pid>'.`,
    },
  ]);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll console on new output
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleHistory]);

  // Live Clock Update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setClockString(`${formatted}  ${time}`);
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // ============================================================================
  // SECTION 4: HARDWARE ARCHITECTURE POLLING LOOP & SCHEDULER ENGINE
  // ============================================================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);

      setProcesses((prevProcs) =>
        prevProcs.map((proc) => {
          const jitter = (Math.random() - 0.48) * 1.8;
          const spikeMultiplier = hardwareSpikeMode ? 3.4 : 1;
          const baseCpu =
            proc.category === 'kernel'
              ? 3.2
              : proc.category === 'daemon'
              ? 2.4
              : proc.category === 'worker'
              ? 14.5
              : 4.2;
          const nextCpu = Math.max(
            0.4,
            Math.min(99.2, Number(((baseCpu + jitter) * spikeMultiplier).toFixed(1)))
          );
          const memDelta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 2 : -2) : 0;
          const nextMem = Math.max(32, proc.memoryMB + memDelta);

          return {
            ...proc,
            ticks: proc.ticks + 1,
            cpuPct: nextCpu,
            memoryMB: nextMem,
            status: nextCpu > 28 ? 'high-load' : 'running',
          };
        })
      );

      setCpuCores((prevCores) =>
        prevCores.map((val, idx) => {
          const base = hardwareSpikeMode ? 78 + (idx % 3) * 6 : 16 + (idx % 4) * 5;
          const delta = Math.floor((Math.random() - 0.45) * 14);
          return Math.max(4, Math.min(100, base + delta));
        })
      );

      setCachePages((prev) =>
        Math.max(24000, prev + Math.floor((Math.random() - 0.46) * 180))
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [hardwareSpikeMode]);

  // Aggregate Telemetry Calculations
  const telemetry = useMemo(() => {
    const totalMemMB = 16384;
    const usedMemMB = processes.reduce((acc, p) => acc + p.memoryMB, 1420);
    const memPct = Math.min(98, Math.round((usedMemMB / totalMemMB) * 100));
    const avgCpu = Math.min(
      100,
      Math.round(
        cpuCores.reduce((a, b) => a + b, 0) / cpuCores.length
      )
    );
    const totalThreads = processes.reduce((acc, p) => acc + p.threads, 0);

    return {
      totalMemMB,
      usedMemMB,
      memPct,
      avgCpu,
      totalThreads,
      activePids: processes.length,
    };
  }, [processes, cpuCores]);

  // Automatically trigger Dynamic Island warning when hardware spike occurs
  useEffect(() => {
    if (hardwareSpikeMode) {
      triggerIslandAlert(
        'spike',
        'High Hardware Load Detected',
        'Scheduler P-Cores exceeding thermal threshold (88%+)',
        'CPU / RAM',
        `${telemetry.avgCpu}% · ${(telemetry.usedMemMB / 1024).toFixed(1)} GB`,
        'critical'
      );
    }
  }, [hardwareSpikeMode, triggerIslandAlert, telemetry.avgCpu, telemetry.usedMemMB]);

  // ============================================================================
  // SECTION 5: PROCESS & WINDOW LIFECYCLE OPERATIONS
  // ============================================================================

  const focusWindow = useCallback((appId: AppId) => {
    setFocusedApp(appId);
    setTopZIndex((prev) => {
      const nextZ = prev + 1;
      setWindows((prevWins) => ({
        ...prevWins,
        [appId]: {
          ...prevWins[appId],
          zIndex: nextZ,
        },
      }));
      return nextZ;
    });
  }, []);

  const launchOrFocusApp = useCallback(
    (appId: AppId) => {
      setOpenMenu(null);
      setControlCenterOpen(false);
      const meta = APP_METADATA[appId];

      setWindows((prev) => {
        const target = prev[appId];
        const nextZ = topZIndex + 1;
        setTopZIndex(nextZ);
        setFocusedApp(appId);

        return {
          ...prev,
          [appId]: {
            ...target,
            isOpen: true,
            isMinimized: false,
            zIndex: nextZ,
          },
        };
      });

      // Check if process already exists in kernel scheduler
      setProcesses((prevProcs) => {
        const existing = prevProcs.find((p) => p.appId === appId);
        if (existing) {
          return prevProcs;
        }
        const allocatedPid = nextPid;
        setNextPid((p) => p + Math.floor(Math.random() * 12) + 4);

        const newProc: KernelProcess = {
          pid: allocatedPid,
          name: meta.procName,
          appId,
          category: 'app',
          status: 'running',
          memoryMB: meta.baseMemMB,
          cpuPct: 4.6,
          ticks: 1,
          threads: 10,
          flags: meta.flags,
        };

        triggerIslandAlert(
          'spawn',
          `Process Allocated · ${meta.shortName}`,
          `Scheduled ${meta.procName} in ring-3 user space`,
          `PID ${allocatedPid}`,
          `+${meta.baseMemMB} MB`,
          'normal'
        );

        return [...prevProcs, newProc];
      });
    },
    [nextPid, topZIndex, triggerIslandAlert]
  );

  const closeAppWindow = useCallback(
    (appId: AppId) => {
      const meta = APP_METADATA[appId];
      setWindows((prev) => ({
        ...prev,
        [appId]: {
          ...prev[appId],
          isOpen: false,
          isMinimized: false,
          isMaximized: false,
        },
      }));

      setProcesses((prevProcs) => {
        const targetProc = prevProcs.find((p) => p.appId === appId);
        if (targetProc) {
          triggerIslandAlert(
            'kill',
            `Process Terminated · ${targetProc.name}`,
            `Reclaimed ${targetProc.memoryMB} MB slab memory to kernel pool`,
            `PID ${targetProc.pid}`,
            `-${targetProc.memoryMB} MB`,
            'warning'
          );
        } else {
          triggerIslandAlert(
            'kill',
            `Window Closed · ${meta.shortName}`,
            `Detached surface buffer from quartz compositor`,
            `SURFACE`,
            `FREE`,
            'normal'
          );
        }
        return prevProcs.filter((p) => p.appId !== appId);
      });
    },
    [triggerIslandAlert]
  );

  const minimizeAppWindow = useCallback(
    (appId: AppId) => {
      setWindows((prev) => ({
        ...prev,
        [appId]: {
          ...prev[appId],
          isMinimized: true,
        },
      }));
      triggerIslandAlert(
        'system',
        `Window Minimized · ${APP_METADATA[appId].shortName}`,
        'Surface suspended to Dock background buffer',
        'STATE',
        'SLEEP',
        'normal'
      );
    },
    [triggerIslandAlert]
  );

  const toggleMaximizeAppWindow = useCallback((appId: AppId) => {
    setWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        isMaximized: !prev[appId].isMaximized,
      },
    }));
    focusWindow(appId);
  }, [focusWindow]);

  const killProcessByPid = useCallback(
    (pid: number): { ok: boolean; message: string } => {
      const target = processes.find((p) => p.pid === pid);
      if (!target) {
        return {
          ok: false,
          message: `kill: (${pid}) - No such process in kernel task_struct`,
        };
      }
      if (target.category === 'kernel' || target.pid === 1) {
        triggerIslandAlert(
          'spike',
          `SIGKILL Denied · PID ${pid}`,
          `Cannot terminate Ring-0 protected process (${target.name})`,
          'ERR_PERM',
          'RING 0',
          'critical'
        );
        return {
          ok: false,
          message: `kill: (${pid}) Operation not permitted — ${target.name} is a protected Ring-0 kernel task.`,
        };
      }

      setProcesses((prev) => prev.filter((p) => p.pid !== pid));
      if (target.appId) {
        const appId = target.appId;
        setWindows((prev) => ({
          ...prev,
          [appId]: {
            ...prev[appId],
            isOpen: false,
            isMinimized: false,
          },
        }));
      }

      triggerIslandAlert(
        'kill',
        `SIGKILL Dispatched · PID ${target.pid}`,
        `Killed ${target.name} and freed ${target.memoryMB} MB virtual RAM`,
        `PID ${target.pid}`,
        `-${target.memoryMB} MB`,
        'warning'
      );

      return {
        ok: true,
        message: `[SIGKILL] Process ${target.pid} (${target.name}) terminated. Reclaimed ${target.memoryMB} MB.`,
      };
    },
    [processes, triggerIslandAlert]
  );

  const spawnMicroRoutine = useCallback(
    (customName?: string) => {
      const pid = nextPid;
      setNextPid((p) => p + Math.floor(Math.random() * 15) + 5);
      const workerNames = [
        'tensor_Matrix_worker',
        'vfs_indexer_thread',
        'glsl_raymarch_job',
        'net_packet_scrubber',
        'zstd_page_compressor',
      ];
      const chosenName =
        customName || workerNames[Math.floor(Math.random() * workerNames.length)];
      const mem = Math.floor(Math.random() * 140) + 95;

      const newProc: KernelProcess = {
        pid,
        name: chosenName,
        category: 'worker',
        status: 'high-load',
        memoryMB: mem,
        cpuPct: 16.4,
        ticks: 1,
        threads: 6,
        flags: '0x0400 MICRO_ROUTINE',
      };

      setProcesses((prev) => [...prev, newProc]);
      triggerIslandAlert(
        'spawn',
        `Micro-Routine Spawned · ${chosenName}`,
        `Dispatched background worker thread to P-Core cluster`,
        `PID ${pid}`,
        `+${mem} MB`,
        'normal'
      );
      return newProc;
    },
    [nextPid, triggerIslandAlert]
  );

  const purgeKernelMemory = useCallback(() => {
    setHardwareSpikeMode(false);
    setCachePages(26400);
    setProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        memoryMB: Math.max(48, Math.round(p.memoryMB * 0.82)),
        cpuPct: Math.max(0.8, Number((p.cpuPct * 0.5).toFixed(1))),
        status: 'running',
      }))
    );
    triggerIslandAlert(
      'system',
      'Slab Cache Purged & Throttled',
      'Reclaimed inactive memory pages and stabilized CPU P-Cores',
      'CACHE',
      'OPTIMAL',
      'normal'
    );
  }, [triggerIslandAlert]);

  // Tile / Cascade Window Layout Helpers
  const tileWindowsLayout = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const openIds = (Object.keys(windows) as AppId[]).filter(
      (id) => windows[id].isOpen && !windows[id].isMinimized
    );
    if (openIds.length === 0) return;

    const cols = vw < 900 ? 1 : openIds.length === 1 ? 1 : 2;
    const rows = Math.ceil(openIds.length / cols);
    const pad = 14;
    const topOffset = 46;
    const bottomDockSpace = 92;
    const availW = vw - pad * (cols + 1);
    const availH = vh - topOffset - bottomDockSpace - pad * (rows + 1);
    const cellW = Math.max(300, Math.floor(availW / cols));
    const cellH = Math.max(240, Math.floor(availH / rows));

    setWindows((prev) => {
      const next = { ...prev };
      openIds.forEach((id, idx) => {
        const c = idx % cols;
        const r = Math.floor(idx / cols);
        next[id] = {
          ...next[id],
          isMaximized: false,
          x: pad + c * (cellW + pad),
          y: topOffset + pad + r * (cellH + pad),
          width: cellW,
          height: cellH,
        };
      });
      return next;
    });

    triggerIslandAlert(
      'system',
      'Workspace Windows Tiled',
      `Aligned ${openIds.length} active glass surfaces to viewport grid`,
      'GRID',
      `${cols}x${rows}`,
      'normal'
    );
  }, [windows, triggerIslandAlert]);

  // ============================================================================
  // SECTION 6: POINTER / TOUCH WINDOW DRAGGING ENGINE (X11/VNC & MOBILE READY)
  // ============================================================================

  const dragRef = useRef<{
    appId: AppId;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const handleWindowDragStart = (
    e: React.PointerEvent<HTMLDivElement>,
    appId: AppId
  ) => {
    // Do not drag if clicking buttons/controls inside header
    if ((e.target as HTMLElement).closest('button')) return;
    const win = windows[appId];
    if (win.isMaximized) return;

    focusWindow(appId);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      appId,
      startX: e.clientX,
      startY: e.clientY,
      origX: win.x,
      origY: win.y,
    };
  };

  const handleWindowDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const { appId, startX, startY, origX, origY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const maxX = Math.max(0, window.innerWidth - 180);
    const maxY = Math.max(38, window.innerHeight - 120);

    const nextX = Math.max(-40, Math.min(maxX, origX + dx));
    const nextY = Math.max(36, Math.min(maxY, origY + dy));

    setWindows((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        x: nextX,
        y: nextY,
      },
    }));
  };

  const handleWindowDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer already released
    }
    dragRef.current = null;
  };

  // ============================================================================
  // SECTION 7: KERNEL SYSTEM CONSOLE COMMAND PARSER
  // ============================================================================

  const executeConsoleCommand = useCallback(
    (rawCmd: string) => {
      const trimmed = rawCmd.trim();
      const inputLine: ConsoleLine = {
        id: `in-${Date.now()}-${Math.random()}`,
        type: 'input',
        text: `root@ember-kernel:~# ${trimmed}`,
      };

      if (!trimmed) {
        setConsoleHistory((prev) => [...prev, inputLine]);
        return;
      }

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      const pushLines = (lines: Omit<ConsoleLine, 'id'>[]) => {
        setConsoleHistory((prev) => [
          ...prev,
          inputLine,
          ...lines.map((l, i) => ({
            ...l,
            id: `out-${Date.now()}-${i}-${Math.random()}`,
          })),
        ]);
      };

      switch (cmd) {
        case 'help': {
          pushLines([
            {
              type: 'output',
              text: `EMBER OS KERNEL SHELL (/bin/esh) — BUILT-IN SYSTEM COMMANDS:
  help                  Display this kernel command reference
  neofetch              Print Ember OS ASCII insignia & machine telemetry
  ps                    Dump live scheduler process table & memory maps
  kill <pid>            Send SIGKILL to target PID (triggers Dynamic Island)
  ls [dir]              List Virtual File System (VFS) directories & inodes
  cat <filepath>        Inspect contents of a file in the VFS disk array
  spawn [name]          Allocate and schedule a new background worker thread
  stress                Toggle hardware CPU/RAM load spike simulation
  purge                 Purge inactive VFS cache pages & throttle CPU
  clear                 Clear terminal scrollback buffer`,
            },
          ]);
          break;
        }

        case 'neofetch': {
          const upHrs = Math.floor(uptimeSeconds / 3600);
          const upMins = Math.floor((uptimeSeconds % 3600) / 60);
          const upSecs = uptimeSeconds % 60;
          pushLines([
            {
              type: 'ascii',
              text: `        .---.            root@ember-sequoia-node
       /     \\           -----------------------
      | () () |          OS: Ember OS v4.8.2 (Sequoia Glass)
       \\  ^  /           Kernel: 6.12.0-ember-ring0-preempt
        |||||            Uptime: ${upHrs}h ${upMins}m ${upSecs}s (${uptimeSeconds} ticks)
   ____/|||||\\____       Shell: /bin/esh (Ember AST v2.4)
  /   _       _   \\      Compositor: Quartz Glass (Blur: ${blurIntensity}px)
 |   / \\     / \\   |     Theme Profile: ${activeTheme.name}
 |  |   |   |   |  |     Active Processes: ${processes.length} scheduled (${telemetry.totalThreads} threads)
  \\  \\_/     \\_/  /      CPU Load: ${telemetry.avgCpu}% across 8 virtual cores
   \\_____________/       Memory: ${telemetry.usedMemMB} MB / ${telemetry.totalMemMB} MB (${telemetry.memPct}%)
                         VFS Disk Array: ${vfsFiles.length} inodes mounted [RW]`,
            },
          ]);
          break;
        }

        case 'ps': {
          const header =
            'PID     CATEGORY   CPU%    MEM(MB)   TICKS    FLAGS                  NAME';
          const divider =
            '----------------------------------------------------------------------------------------';
          const rows = processes.map(
            (p) =>
              `${String(p.pid).padEnd(7)} ${p.category.padEnd(10)} ${String(
                p.cpuPct.toFixed(1) + '%'
              ).padEnd(7)} ${String(p.memoryMB + ' MB').padEnd(9)} ${String(
                p.ticks
              ).padEnd(8)} ${p.flags.padEnd(22)} ${p.name}`
          );
          pushLines([
            {
              type: 'table',
              text: [header, divider, ...rows].join('\n'),
            },
          ]);
          break;
        }

        case 'kill': {
          if (!args[0]) {
            pushLines([
              {
                type: 'error',
                text: 'kill: usage: kill <pid> (Hint: run "ps" to view active PIDs)',
              },
            ]);
            break;
          }
          const targetPid = Number(args[0]);
          if (Number.isNaN(targetPid)) {
            pushLines([
              {
                type: 'error',
                text: `kill: ${args[0]}: arguments must be numeric process IDs`,
              },
            ]);
            break;
          }
          const res = killProcessByPid(targetPid);
          pushLines([
            {
              type: res.ok ? 'output' : 'error',
              text: res.message,
            },
          ]);
          break;
        }

        case 'ls': {
          const dirArg = args[0];
          if (!dirArg) {
            const dirSummary = DIRECTORIES.map((d) => {
              const count = vfsFiles.filter((f) => f.parentDir === d).length;
              return `drwxr-xr-x   root   wheel   ${String(count).padStart(
                2
              )} files   ${d}`;
            }).join('\n');
            pushLines([
              {
                type: 'table',
                text: `MOUNTED VFS DIRECTORIES:\n${dirSummary}\n\nTip: Run 'ls /kernel/core' or 'ls /user/desktop' to inspect files.`,
              },
            ]);
          } else {
            const normalized = dirArg.startsWith('/') ? dirArg : `/${dirArg}`;
            const matching = vfsFiles.filter((f) => f.parentDir === normalized);
            if (matching.length === 0) {
              pushLines([
                {
                  type: 'error',
                  text: `ls: cannot access '${dirArg}': No such directory in VFS (${DIRECTORIES.join(
                    ', '
                  )})`,
                },
              ]);
            } else {
              const list = matching
                .map(
                  (f) =>
                    `${f.permissions}  inode:${f.inode}  ${String(
                      f.sizeBytes
                    ).padStart(6)}B  ${f.updatedAt}  ${f.path}`
                )
                .join('\n');
              pushLines([{ type: 'table', text: list }]);
            }
          }
          break;
        }

        case 'cat': {
          if (!args[0]) {
            pushLines([
              {
                type: 'error',
                text: 'cat: missing file operand. Example: cat /root/boot.cfg',
              },
            ]);
            break;
          }
          const query = args[0];
          const found = vfsFiles.find(
            (f) => f.path === query || f.name.toLowerCase() === query.toLowerCase()
          );
          if (!found) {
            pushLines([
              {
                type: 'error',
                text: `cat: ${query}: No such file in VFS array`,
              },
            ]);
          } else {
            pushLines([
              {
                type: 'output',
                text: `--- [${found.path}] (${found.sizeBytes} bytes | inode ${found.inode}) ---\n${found.content}`,
              },
            ]);
          }
          break;
        }

        case 'spawn': {
          const proc = spawnMicroRoutine(args[0]);
          pushLines([
            {
              type: 'output',
              text: `[SCHEDULER] Spawned worker '${proc.name}' with PID ${proc.pid} (+${proc.memoryMB} MB).`,
            },
          ]);
          break;
        }

        case 'stress': {
          setHardwareSpikeMode((prev) => {
            const next = !prev;
            pushLines([
              {
                type: next ? 'error' : 'output',
                text: next
                  ? '[HARDWARE ALERT] Synthetic CPU/RAM thermal stress test ENABLED. Dynamic Island notified.'
                  : '[HARDWARE NORMAL] Synthetic stress test disabled. Cores returning to nominal clocks.',
              },
            ]);
            return next;
          });
          break;
        }

        case 'purge': {
          purgeKernelMemory();
          pushLines([
            {
              type: 'output',
              text: '[VFS PAGER] Purged inactive slab cache pages and throttled runaway worker threads.',
            },
          ]);
          break;
        }

        case 'clear': {
          setConsoleHistory([]);
          break;
        }

        default: {
          pushLines([
            {
              type: 'error',
              text: `esh: command not found: ${cmd}. Type 'help' for available kernel commands.`,
            },
          ]);
        }
      }
    },
    [
      uptimeSeconds,
      blurIntensity,
      activeTheme.name,
      processes,
      telemetry,
      vfsFiles,
      killProcessByPid,
      spawnMicroRoutine,
      purgeKernelMemory,
    ]
  );

  // ============================================================================
  // SECTION 8: CALCULATOR & PERSISTENT NOTES HANDLERS
  // ============================================================================

  const handleCalcButton = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcEquation('');
      return;
    }
    if (val === '±') {
      setCalcDisplay((prev) =>
        prev.startsWith('-') ? prev.slice(1) : prev !== '0' ? `-${prev}` : '0'
      );
      return;
    }
    if (val === '%') {
      const num = parseFloat(calcDisplay);
      if (!Number.isNaN(num)) {
        setCalcDisplay(String(Number((num / 100).toFixed(6))));
      }
      return;
    }
    if (['+', '-', '*', '/'].includes(val)) {
      setCalcEquation(`${calcDisplay} ${val} `);
      setCalcDisplay('0');
      return;
    }
    if (val === '=') {
      if (!calcEquation) return;
      const fullExpr = `${calcEquation}${calcDisplay}`;
      try {
        const parts = fullExpr.trim().split(/\s+/);
        const a = parseFloat(parts[0]);
        const op = parts[1];
        const b = parseFloat(parts[2]);
        let result = 0;
        if (op === '+') result = a + b;
        else if (op === '-') result = a - b;
        else if (op === '*') result = a * b;
        else if (op === '/') result = b === 0 ? NaN : a / b;

        const formatted = Number.isNaN(result)
          ? 'ERR_DIV_0'
          : String(Number(result.toFixed(6)));
        setCalcDisplay(formatted);
        setCalcHistory((prev) => [`${fullExpr} = ${formatted}`, ...prev.slice(0, 9)]);
        setCalcEquation('');
      } catch {
        setCalcDisplay('Error');
      }
      return;
    }

    // Digits or decimal
    if (val === '.' && calcDisplay.includes('.')) return;
    setCalcDisplay((prev) => (prev === '0' && val !== '.' ? val : prev + val));
  };

  // Notes in /user/desktop
  const desktopNotes = useMemo(
    () => vfsFiles.filter((f) => f.parentDir === '/user/desktop'),
    [vfsFiles]
  );

  const activeNoteFile = useMemo(
    () =>
      desktopNotes.find((f) => f.path === activeNotePath) ||
      desktopNotes[0] ||
      null,
    [desktopNotes, activeNotePath]
  );

  const handleUpdateNoteContent = (newContent: string) => {
    if (!activeNoteFile) return;
    const nowStr = new Date().toTimeString().slice(0, 5);
    setVfsFiles((prev) =>
      prev.map((f) =>
        f.path === activeNoteFile.path
          ? {
              ...f,
              content: newContent,
              sizeBytes: new Blob([newContent]).size,
              updatedAt: `2026-10-31 ${nowStr}`,
            }
          : f
      )
    );
  };

  const handleCreateNewNote = () => {
    const clean = newNoteName
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .toLowerCase();
    const finalName = clean
      ? clean.includes('.')
        ? clean
        : `${clean}.md`
      : `note_${vfsFiles.length + 1}.md`;
    const fullPath = `/user/desktop/${finalName}`;

    if (vfsFiles.some((f) => f.path === fullPath)) {
      setActiveNotePath(fullPath);
      setNewNoteName('');
      return;
    }

    const created: VfsFile = {
      name: finalName,
      path: fullPath,
      parentDir: '/user/desktop',
      sizeBytes: 128,
      permissions: '-rw-rw-r--',
      inode: 5000 + vfsFiles.length + 1,
      updatedAt: '2026-10-31 03:20',
      type: 'markdown',
      description: 'User workspace note persisted to local browser storage & VFS.',
      content: `# ${finalName}\n\nCreated in Ember OS Utility Shelf.\nPersisted automatically to /user/desktop/${finalName}.`,
    };

    setVfsFiles((prev) => [...prev, created]);
    setActiveNotePath(fullPath);
    setNewNoteName('');

    triggerIslandAlert(
      'vfs',
      `VFS Inode Committed · ${finalName}`,
      `Mounted new file at ${fullPath} in persistent storage`,
      `INODE ${created.inode}`,
      `${created.sizeBytes} B`,
      'normal'
    );
  };

  // ============================================================================
  // SECTION 9: RENDER APPLICATION WINDOW CONTENTS
  // ============================================================================

  const renderAppContent = (appId: AppId) => {
    switch (appId) {
      // ------------------------------------------------------------------------
      // APP 1: KERNEL SYSTEM CONSOLE
      // ------------------------------------------------------------------------
      case 'console': {
        const quickCommands = [
          'help',
          'neofetch',
          'ps',
          'ls /kernel/core',
          'cat /root/boot.cfg',
          'spawn neural_worker',
          'stress',
          'clear',
        ];
        return (
          <div className="flex flex-col h-full bg-slate-950/90 text-slate-100 font-mono-tabular">
            {/* Quick Touch Command Bar for Mobile / VNC Convenience */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 border-b border-white/10 overflow-x-auto shrink-0">
              <span className="text-[11px] text-slate-400 mr-1 whitespace-nowrap">
                Quick Exec:
              </span>
              {quickCommands.map((qCmd) => (
                <button
                  key={qCmd}
                  onClick={() => executeConsoleCommand(qCmd)}
                  className="px-2 py-1 text-[11px] rounded bg-white/5 hover:bg-white/15 text-emerald-300 border border-emerald-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {qCmd}
                </button>
              ))}
            </div>

            {/* Terminal Output Log */}
            <div
              className="flex-1 p-3.5 overflow-y-auto space-y-2 text-xs leading-relaxed select-text"
              onClick={() =>
                document.getElementById('ember-console-input')?.focus()
              }
            >
              {consoleHistory.map((line) => (
                <div key={line.id} className="whitespace-pre-wrap break-words">
                  {line.type === 'input' && (
                    <span className="text-slate-100 font-semibold">
                      {line.text}
                    </span>
                  )}
                  {line.type === 'ascii' && (
                    <span
                      className={`${activeTheme.terminalText} font-semibold drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]`}
                    >
                      {line.text}
                    </span>
                  )}
                  {line.type === 'output' && (
                    <span className="text-emerald-200/90">{line.text}</span>
                  )}
                  {line.type === 'table' && (
                    <span className="text-sky-200/95">{line.text}</span>
                  )}
                  {line.type === 'error' && (
                    <span className="text-rose-400 font-medium">
                      {line.text}
                    </span>
                  )}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>

            {/* Interactive Command Prompt Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeConsoleCommand(consoleInput);
                setConsoleInput('');
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 border-t border-white/10 shrink-0"
            >
              <span className={`${activeTheme.terminalText} text-xs font-semibold shrink-0`}>
                root@ember-kernel:~#
              </span>
              <input
                id="ember-console-input"
                type="text"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                placeholder="Type help, neofetch, ps, kill <pid>..."
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono-tabular"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded transition-colors cursor-pointer shrink-0"
              >
                Run
              </button>
            </form>
          </div>
        );
      }

      // ------------------------------------------------------------------------
      // APP 2: GRAPHICAL FILE NAVIGATOR (FINDER STYLE)
      // ------------------------------------------------------------------------
      case 'finder': {
        const filesInDir = vfsFiles.filter((f) => {
          const matchesDir = f.parentDir === selectedDir;
          const matchesSearch =
            !finderSearch.trim() ||
            f.name.toLowerCase().includes(finderSearch.toLowerCase()) ||
            f.description.toLowerCase().includes(finderSearch.toLowerCase());
          return matchesDir && matchesSearch;
        });

        const inspectedFile =
          vfsFiles.find((f) => f.path === selectedFilePath) || filesInDir[0];

        return (
          <div className="flex flex-col h-full text-slate-100">
            {/* Finder Sub-Toolbar */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-white/5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 overflow-x-auto">
                <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="font-medium text-white">VFS_NVMe_0</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="font-mono-tabular text-sky-300">
                  {selectedDir}
                </span>
              </div>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={finderSearch}
                  onChange={(e) => setFinderSearch(e.target.value)}
                  placeholder="Filter directory..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-black/40 border border-white/15 rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* 3-Column Miller Explorer */}
            <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-white/10">
              {/* Column 1: Systemic Directories */}
              <div
                className="col-span-4 sm:col-span-3 p-2 overflow-y-auto space-y-1"
                style={{ background: activeTheme.sidebarBg }}
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                  Systemic Mounts
                </div>
                {DIRECTORIES.map((dir) => {
                  const isSelected = selectedDir === dir;
                  const count = vfsFiles.filter((f) => f.parentDir === dir).length;
                  return (
                    <button
                      key={dir}
                      onClick={() => {
                        setSelectedDir(dir);
                        const first = vfsFiles.find((f) => f.parentDir === dir);
                        if (first) setSelectedFilePath(first.path);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/25 text-white border border-sky-400/40'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Folder
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-sky-300' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate font-mono-tabular">{dir}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-tabular ml-1">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Column 2: Files in Selected Directory */}
              <div className="col-span-4 sm:col-span-4 p-2 overflow-y-auto space-y-1 bg-black/20">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                  Inodes ({filesInDir.length})
                </div>
                {filesInDir.map((file) => {
                  const isActive = inspectedFile?.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFilePath(file.path)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white/15 text-white border border-white/25'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400 font-mono-tabular">
                        {file.sizeBytes} B · {file.permissions}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Column 3: Dynamic File Description & Content Inspector */}
              <div className="col-span-4 sm:col-span-5 p-3 overflow-y-auto flex flex-col justify-between bg-black/35">
                {inspectedFile ? (
                  <div className="space-y-3">
                    <div className="border-b border-white/10 pb-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white truncate">
                          {inspectedFile.name}
                        </h4>
                        <span className="text-[11px] font-mono-tabular text-sky-300">
                          inode #{inspectedFile.inode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {inspectedFile.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 font-mono-tabular">
                        <span>{inspectedFile.path}</span>
                        <span>·</span>
                        <span>{inspectedFile.sizeBytes} bytes</span>
                        <span>·</span>
                        <span>{inspectedFile.permissions}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Raw File Stream Preview
                        </span>
                        {inspectedFile.parentDir === '/user/desktop' && (
                          <button
                            onClick={() => {
                              setActiveNotePath(inspectedFile.path);
                              setUtilityTab('notes');
                              launchOrFocusApp('utility');
                            }}
                            className="flex items-center gap-1 text-[11px] text-sky-300 hover:text-sky-200 cursor-pointer"
                          >
                            <span>Edit in Notes</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-950/90 border border-white/10 text-[11px] text-emerald-300 font-mono-tabular overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-52">
                        {inspectedFile.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-8 text-center">
                    Select a file inode to inspect its metadata and contents.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // ------------------------------------------------------------------------
      // APP 3: PERFORMANCE DISPATCHER (ACTIVITY MONITOR)
      // ------------------------------------------------------------------------
      case 'monitor': {
        return (
          <div className="flex flex-col h-full text-slate-100 p-3.5 space-y-3 overflow-y-auto">
            {/* Top Real-Time Hardware Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
              {/* CPU Load Card */}
              <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>CPU Scheduler Load</span>
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono-tabular text-white">
                    {telemetry.avgCpu}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-tabular">
                    8 Virtual Cores
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-8 gap-1 h-8 items-end">
                  {cpuCores.map((corePct, idx) => (
                    <div
                      key={idx}
                      className="w-full bg-white/10 rounded-sm h-full flex items-end overflow-hidden"
                      title={`Core ${idx}: ${corePct}%`}
                    >
                      <div
                        className={`w-full transition-all duration-300 ${
                          corePct > 80
                            ? 'bg-rose-500'
                            : corePct > 50
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                        }`}
                        style={{ height: `${corePct}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Virtual RAM Card */}
              <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Virtual RAM Allocation</span>
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono-tabular text-white">
                    {(telemetry.usedMemMB / 1024).toFixed(2)} GB
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-tabular">
                    / 16.0 GB ({telemetry.memPct}%)
                  </span>
                </div>
                <div className="mt-3 w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      telemetry.memPct > 80 ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${telemetry.memPct}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[10px] text-slate-400 font-mono-tabular">
                  Cache Pages: {cachePages.toLocaleString()} · Threads: {telemetry.totalThreads}
                </div>
              </div>

              {/* Live Hardware Controls */}
              <div className="p-3 rounded-xl bg-black/35 border border-white/10 flex flex-col justify-between gap-2">
                <div className="text-xs font-medium text-slate-300">
                  Dispatcher Controls
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => spawnMicroRoutine()}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/30 text-sky-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Spawn Worker</span>
                  </button>
                  <button
                    onClick={() => setHardwareSpikeMode((prev) => !prev)}
                    className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                      hardwareSpikeMode
                        ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/30 text-amber-200'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{hardwareSpikeMode ? 'Stop Spike' : 'Spike Load'}</span>
                  </button>
                </div>
                <button
                  onClick={purgeKernelMemory}
                  className="w-full px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Purge Slab Cache &amp; Stabilize</span>
                </button>
              </div>
            </div>

            {/* Process Dispatcher Table */}
            <div className="flex-1 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex flex-col min-h-[180px]">
              <div className="px-3.5 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Active Kernel &amp; User Processes ({processes.length})
                </span>
                <span className="text-[11px] text-slate-400 font-mono-tabular">
                  Click SIGKILL to terminate user/worker tasks
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                {processes.map((proc) => {
                  const isRing0 = proc.category === 'kernel';
                  return (
                    <div
                      key={proc.pid}
                      className="px-3.5 py-2 flex items-center justify-between gap-2 text-xs hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tabular text-sky-300 font-semibold w-12 shrink-0">
                            #{proc.pid}
                          </span>
                          <span className="font-medium text-white truncate">
                            {proc.name}
                          </span>
                          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono-tabular">
                            · {proc.flags}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono-tabular shrink-0">
                        <div className="w-20 hidden md:block">
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                proc.cpuPct > 25 ? 'bg-rose-400' : 'bg-sky-400'
                              }`}
                              style={{
                                width: `${Math.min(100, proc.cpuPct * 2)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-right text-slate-200">
                          {proc.cpuPct.toFixed(1)}%
                        </span>
                        <span className="w-16 text-right text-emerald-300">
                          {proc.memoryMB} MB
                        </span>
                        <button
                          onClick={() => killProcessByPid(proc.pid)}
                          disabled={isRing0}
                          title={
                            isRing0
                              ? 'Protected Ring-0 Kernel Process'
                              : `Send SIGKILL to PID ${proc.pid}`
                          }
                          className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                            isRing0
                              ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                              : 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/30 cursor-pointer'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isRing0 ? 'RING0' : 'Kill'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      // ------------------------------------------------------------------------
      // APP 4: UI RE-THEMING ENGINE (SYSTEM SETTINGS)
      // ------------------------------------------------------------------------
      case 'settings': {
        return (
          <div className="flex flex-col h-full text-slate-100 p-4 space-y-5 overflow-y-auto">
            {/* Section 1: Theme Palette Profiles */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                01. System Theme Palette Profiles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(THEME_PROFILES) as ThemeProfileId[]).map((id) => {
                  const profile = THEME_PROFILES[id];
                  const selected = themeId === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setThemeId(id);
                        triggerIslandAlert(
                          'theme',
                          `Theme Engine · ${profile.name}`,
                          'Recompiled glass shaders & specular accents',
                          'PROFILE',
                          id.toUpperCase(),
                          'normal'
                        );
                      }}
                      className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                        selected
                          ? 'bg-white/15 border-white shadow-lg'
                          : 'bg-black/35 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          {profile.name}
                        </span>
                        {selected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {profile.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Real-Time Glassmorphism Backdrop-Blur Slider */}
            <div className="p-3.5 rounded-xl bg-black/35 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    02. Quartz Backdrop-Blur Intensity
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Controls live CSS backdrop-filter Gaussian blur radius across all OS surfaces
                  </p>
                </div>
                <span className="text-sm font-bold font-mono-tabular text-sky-300">
                  {blurIntensity}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={48}
                value={blurIntensity}
                onChange={(e) => setBlurIntensity(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono-tabular">
                <span>0px (Raw Transparent)</span>
                <span>24px (Ember Native)</span>
                <span>48px (Deep Frosted Quartz)</span>
              </div>
            </div>

            {/* Section 3: Spatial Wallpaper Grid Selector */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                03. Spatial Desktop Wallpaper Grid
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WALLPAPERS.map((wp) => {
                  const isSelected = wallpaperId === wp.id;
                  return (
                    <button
                      key={wp.id}
                      onClick={() => {
                        setWallpaperId(wp.id);
                        triggerIslandAlert(
                          'theme',
                          `Wallpaper Updated · ${wp.name}`,
                          `Applied ${wp.category} procedural mesh backdrop`,
                          'DISPLAY',
                          '120Hz',
                          'normal'
                        );
                      }}
                      className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-white ring-2 ring-sky-400/50'
                          : 'border-white/15 hover:border-white/40'
                      }`}
                    >
                      <div
                        className="h-16 w-full"
                        style={{ background: wp.cssBackground }}
                      />
                      <div className="p-2 bg-black/70">
                        <div className="text-xs font-medium text-white truncate">
                          {wp.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {wp.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      // ------------------------------------------------------------------------
      // APP 5: UTILITY APPLICATION SHELF (CALCULATOR + PERSISTENT VFS NOTES)
      // ------------------------------------------------------------------------
      case 'utility': {
        return (
          <div className="flex flex-col h-full text-slate-100">
            {/* Segmented Mode Switcher */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/10">
                <button
                  onClick={() => setUtilityTab('notes')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    utilityTab === 'notes'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>VFS Notes &amp; Editor</span>
                </button>
                <button
                  onClick={() => setUtilityTab('calculator')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    utilityTab === 'calculator'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CalcIcon className="w-3.5 h-3.5" />
                  <span>Precision Calculator</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono-tabular hidden sm:inline">
                {utilityTab === 'notes'
                  ? 'Synced with /user/desktop & localStorage'
                  : 'IEEE-754 Floating Point ALU'}
              </span>
            </div>

            {utilityTab === 'notes' ? (
              <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-white/10">
                {/* Notes Sidebar */}
                <div className="col-span-5 sm:col-span-4 p-2.5 flex flex-col gap-2 bg-black/25 overflow-y-auto">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={newNoteName}
                      onChange={(e) => setNewNoteName(e.target.value)}
                      placeholder="new_note.md"
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-white/15 rounded text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      onClick={handleCreateNewNote}
                      className="px-2 py-1 bg-sky-500/25 hover:bg-sky-500/40 text-sky-200 border border-sky-400/30 rounded text-xs font-medium shrink-0 cursor-pointer"
                      title="Create file in /user/desktop"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-1 flex-1 overflow-y-auto">
                    {desktopNotes.map((note) => {
                      const isSel = activeNoteFile?.path === note.path;
                      return (
                        <button
                          key={note.path}
                          onClick={() => setActiveNotePath(note.path)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSel
                              ? 'bg-white/15 text-white border border-white/25'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <div className="font-medium truncate">{note.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono-tabular mt-0.5">
                            {note.sizeBytes} B · {note.updatedAt}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Editor Stack */}
                <div className="col-span-7 sm:col-span-8 flex flex-col h-full bg-slate-950/60">
                  {activeNoteFile && (
                    <>
                      <div className="px-3 py-1.5 bg-black/30 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono-tabular">
                        <span>{activeNoteFile.path}</span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Save className="w-3 h-3" />
                          <span>Auto-Saved to VFS</span>
                        </span>
                      </div>
                      <textarea
                        value={activeNoteFile.content}
                        onChange={(e) => handleUpdateNoteContent(e.target.value)}
                        className="flex-1 w-full p-3.5 bg-transparent text-xs text-slate-100 font-mono-tabular leading-relaxed focus:outline-none resize-none select-text"
                        placeholder="Write system notes, scripts, or markdown..."
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Integrated Calculator Panel */
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 p-3.5 gap-3 overflow-y-auto">
                <div className="sm:col-span-7 flex flex-col justify-between bg-black/40 border border-white/10 rounded-xl p-3">
                  <div className="text-right p-2 rounded-lg bg-slate-950/90 border border-white/10 mb-2.5">
                    <div className="text-[11px] text-slate-400 font-mono-tabular h-4">
                      {calcEquation || 'ALU READY'}
                    </div>
                    <div className="text-2xl font-bold text-white font-mono-tabular truncate">
                      {calcDisplay}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      'C',
                      '±',
                      '%',
                      '/',
                      '7',
                      '8',
                      '9',
                      '*',
                      '4',
                      '5',
                      '6',
                      '-',
                      '1',
                      '2',
                      '3',
                      '+',
                      '0',
                      '.',
                      '=',
                    ].map((btn) => {
                      const isOp = ['/', '*', '-', '+', '='].includes(btn);
                      const isZero = btn === '0';
                      return (
                        <button
                          key={btn}
                          onClick={() => handleCalcButton(btn)}
                          className={`${
                            isZero ? 'col-span-2' : ''
                          } py-2.5 rounded-lg text-xs font-semibold font-mono-tabular transition-colors cursor-pointer ${
                            isOp
                              ? 'bg-orange-500/80 hover:bg-orange-500 text-white'
                              : ['C', '±', '%'].includes(btn)
                              ? 'bg-white/15 hover:bg-white/25 text-slate-200'
                              : 'bg-white/5 hover:bg-white/15 text-white border border-white/10'
                          }`}
                        >
                          {btn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ALU Tape History */}
                <div className="sm:col-span-5 bg-black/30 border border-white/10 rounded-xl p-3 flex flex-col">
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Calculation Register Tape
                  </div>
                  <div className="flex-1 space-y-1.5 overflow-y-auto font-mono-tabular text-xs text-slate-300">
                    {calcHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-white/5 border border-white/5"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
    }
  };

  // ============================================================================
  // SECTION 10: SINGLE-FILE STANDALONE HTML GENERATOR FOR VNC / EXPORT
  // ============================================================================

  const standaloneHtmlSource = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Ember OS — Single-File Standalone X11/VNC Build</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root { --ember-blur: ${blurIntensity}px; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', sans-serif; overflow: hidden; user-select: none; }
    .ember-glass { backdrop-filter: blur(var(--ember-blur)) saturate(180%); -webkit-backdrop-filter: blur(var(--ember-blur)) saturate(180%); border: 1px solid rgba(255,255,255,0.18); }
  </style>
</head>
<body class="bg-slate-950 text-white h-screen w-screen overflow-hidden">
  <!-- Standalone Ember OS Snapshot exported from live kernel session -->
  <!-- Active Theme: ${activeTheme.name} | Active PIDs: ${processes.length} | VFS Inodes: ${vfsFiles.length} -->
</body>
</html>`;
  }, [blurIntensity, activeTheme.name, processes.length, vfsFiles.length]);

  // ============================================================================
  // SECTION 11: DESKTOP ENVIRONMENT RENDER (MENU BAR + DYNAMIC ISLAND + DOCK)
  // ============================================================================

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none text-slate-100"
      style={{
        background: activeWallpaper.cssBackground,
        filter: `brightness(${displayBrightness}%)`,
      }}
      onClick={() => {
        if (openMenu) setOpenMenu(null);
      }}
    >
      {/* Procedural Subtle Wallpaper Mesh Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: activeWallpaper.overlayMesh,
          backgroundSize: '32px 32px',
        }}
      />

      {/* ====================================================================
          1. TOP GLOBAL MENU BAR WITH INTEGRATED DYNAMIC ISLAND
      ==================================================================== */}
      <header
        className="ember-menubar relative z-[200] h-9 w-full px-3 flex items-center justify-between text-xs"
        style={{ background: 'rgba(8, 10, 16, 0.72)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT ZONE: System Logo + Active App Name + macOS Drop-Down Menus */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          {/* System Flame Logo Dropdown */}
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenu(openMenu === 'ember' ? null : 'ember')
              }
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400/30" />
              <span className="font-bold tracking-tight text-white">Ember</span>
            </button>

            {openMenu === 'ember' && (
              <div className="ember-glass absolute left-0 mt-1.5 w-56 rounded-xl py-1.5 bg-slate-900/90 text-xs shadow-2xl z-[250]">
                <div className="px-3 py-1.5 border-b border-white/10">
                  <div className="font-semibold text-white">
                    Ember OS v4.8.2 (Sequoia)
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-tabular">
                    Ring-0 Preemptive Kernel Active
                  </div>
                </div>
                <button
                  onClick={() => launchOrFocusApp('settings')}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-500/25 flex items-center justify-between cursor-pointer"
                >
                  <span>System Settings &amp; Themes...</span>
                  <span className="text-[10px] text-slate-400">⌘,</span>
                </button>
                <button
                  onClick={() => launchOrFocusApp('monitor')}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-500/25 flex items-center justify-between cursor-pointer"
                >
                  <span>Performance Dispatcher...</span>
                  <span className="text-[10px] text-slate-400">⌘M</span>
                </button>
                <button
                  onClick={() => {
                    spawnMicroRoutine();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-sky-500/25 cursor-pointer"
                >
                  Spawn Kernel Worker Routine
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    purgeKernelMemory();
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-500/25 text-amber-300 cursor-pointer"
                >
                  Purge VFS Slab Cache
                </button>
              </div>
            )}
          </div>

          {/* Focused App Title */}
          <span className="font-semibold text-white px-1.5 hidden sm:inline whitespace-nowrap">
            {APP_METADATA[focusedApp].shortName}
          </span>

          {/* Interactive macOS Menus: File, Edit, View, Go, Window, Help */}
          <nav className="hidden md:flex items-center gap-0.5 text-slate-300">
            {[
              {
                id: 'file',
                label: 'File',
                items: [
                  {
                    label: 'New VFS Note in /user/desktop',
                    action: () => {
                      setUtilityTab('notes');
                      launchOrFocusApp('utility');
                    },
                  },
                  {
                    label: 'Spawn Worker Process',
                    action: () => spawnMicroRoutine(),
                  },
                  {
                    label: 'Export Standalone Single-File HTML...',
                    action: () => setStandaloneModalOpen(true),
                  },
                ],
              },
              {
                id: 'edit',
                label: 'Edit',
                items: [
                  {
                    label: 'Clear Terminal Output Buffer',
                    action: () => setConsoleHistory([]),
                  },
                  {
                    label: 'Reset Calculator Register',
                    action: () => {
                      setCalcDisplay('0');
                      setCalcEquation('');
                    },
                  },
                ],
              },
              {
                id: 'view',
                label: 'View',
                items: [
                  {
                    label: 'Expand Dynamic Island Telemetry',
                    action: () => setIslandExpanded(true),
                  },
                  {
                    label: 'Set Blur: 24px (Native Glass)',
                    action: () => setBlurIntensity(24),
                  },
                  {
                    label: 'Set Blur: 40px (Ultra Frosted)',
                    action: () => setBlurIntensity(40),
                  },
                ],
              },
              {
                id: 'go',
                label: 'Go',
                items: DIRECTORIES.map((dir) => ({
                  label: `Open ${dir}`,
                  action: () => {
                    setSelectedDir(dir);
                    launchOrFocusApp('finder');
                  },
                })),
              },
              {
                id: 'window',
                label: 'Window',
                items: [
                  {
                    label: 'Tile Active Windows to Grid',
                    action: () => tileWindowsLayout(),
                  },
                  {
                    label: 'Open All Pre-Installed System Apps',
                    action: () => {
                      (['console', 'finder', 'monitor', 'settings', 'utility'] as AppId[]).forEach(
                        (id) => launchOrFocusApp(id)
                      );
                    },
                  },
                ],
              },
              {
                id: 'help',
                label: 'Help',
                items: [
                  {
                    label: 'Run neofetch in Kernel Console',
                    action: () => {
                      launchOrFocusApp('console');
                      executeConsoleCommand('neofetch');
                    },
                  },
                  {
                    label: 'Trigger Hardware Spike Simulation',
                    action: () => setHardwareSpikeMode(true),
                  },
                ],
              },
            ].map((menu) => (
              <div key={menu.id} className="relative">
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === menu.id ? null : menu.id)
                  }
                  className={`px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                    openMenu === menu.id ? 'bg-white/15 text-white' : ''
                  }`}
                >
                  {menu.label}
                </button>
                {openMenu === menu.id && (
                  <div className="ember-glass absolute left-0 mt-1.5 w-60 rounded-xl py-1.5 bg-slate-900/95 text-xs shadow-2xl z-[250]">
                    {menu.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setOpenMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-sky-500/25 text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* ==================================================================
            2. CENTER ZONE: DYNAMIC ISLAND ADAPTIVE STATUS ENGINE
        ================================================================== */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1 z-[260]">
          <div
            onClick={() => setIslandExpanded((prev) => !prev)}
            className={`bg-[#050507] text-white border transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.85)] ${
              hardwareSpikeMode
                ? 'border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.45)]'
                : 'border-white/20 hover:border-white/35'
            } ${
              islandExpanded
                ? 'w-[340px] sm:w-[430px] rounded-2xl p-3.5 backdrop-blur-2xl'
                : 'w-[205px] sm:w-[240px] h-7 rounded-full px-3 flex items-center justify-between'
            }`}
          >
            {!islandExpanded ? (
              /* IDLE COMPACT CAPSULE STATE */
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      hardwareSpikeMode
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-slate-200 truncate">
                    {hardwareSpikeMode
                      ? 'THERMAL SPIKE'
                      : `${telemetry.activePids} PIDs · Kernel`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono-tabular text-[11px] text-sky-300 shrink-0">
                  <span>{telemetry.avgCpu}%</span>
                  <span className="text-slate-600">|</span>
                  <span>{(telemetry.usedMemMB / 1024).toFixed(1)}G</span>
                </div>
              </>
            ) : (
              /* EXPANDED GLASS NOTIFICATION & TELEMETRY BANNER STATE */
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        islandAlert?.severity === 'critical' || hardwareSpikeMode
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : islandAlert?.severity === 'warning'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {hardwareSpikeMode ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {islandAlert
                          ? islandAlert.title
                          : 'Ember Dynamic Island · Live Telemetry'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {islandAlert
                          ? islandAlert.subtitle
                          : `${telemetry.activePids} tasks scheduled across 8 virtual cores`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIslandExpanded(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Live Mini Per-Core Waveform & RAM Bar */}
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-white/5 border border-white/10 font-mono-tabular text-[11px]">
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>CPU P/E Cores</span>
                      <span className="text-sky-300 font-semibold">
                        {telemetry.avgCpu}%
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-end gap-1 h-4">
                      {cpuCores.map((c, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-xs transition-all duration-300 ${
                            c > 80 ? 'bg-rose-500' : 'bg-sky-400'
                          }`}
                          style={{ height: `${Math.max(15, c)}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Slab Memory</span>
                      <span className="text-emerald-300 font-semibold">
                        {telemetry.usedMemMB} MB
                      </span>
                    </div>
                    <div className="mt-2 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{ width: `${telemetry.memPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Island Action Controls */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="text-[10px] font-mono-tabular text-slate-400">
                    {islandAlert
                      ? `${islandAlert.metricLabel}: ${islandAlert.metricValue} · ${islandAlert.timestamp}`
                      : `Threads: ${telemetry.totalThreads} · Blur: ${blurIntensity}px`}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => spawnMicroRoutine()}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-white cursor-pointer"
                    >
                      + Worker
                    </button>
                    <button
                      onClick={purgeKernelMemory}
                      className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] text-emerald-300 border border-emerald-500/30 cursor-pointer"
                    >
                      Purge RAM
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT ZONE: System Status Extensions + Working Control Center Toggle */}
        <div className="flex items-center gap-2.5 text-slate-200">
          <button
            onClick={tileWindowsLayout}
            title="Tile Open Windows to Viewport Grid"
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-[11px] text-slate-300 cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">Tile</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono-tabular text-slate-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>

          {/* Control Center Button */}
          <button
            onClick={() => setControlCenterOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
              controlCenterOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10'
            }`}
            title="Toggle Ember OS Control Center"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline text-[11px] font-medium">
              Control
            </span>
          </button>

          {/* Live System Clock */}
          <span className="font-mono-tabular text-[11px] text-slate-200 whitespace-nowrap">
            {clockString}
          </span>
        </div>
      </header>

      {/* ====================================================================
          CONTROL CENTER GLASS POPOVER
      ==================================================================== */}
      {controlCenterOpen && (
        <div
          className="ember-glass fixed right-3 top-11 z-[240] w-80 rounded-2xl p-4 text-slate-100 space-y-4"
          style={{ background: 'rgba(12, 16, 26, 0.86)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div>
              <div className="text-xs font-semibold text-white">
                Ember Control Center
              </div>
              <div className="text-[10px] text-slate-400 font-mono-tabular">
                Quartz Compositor &amp; Kernel Hooks
              </div>
            </div>
            <button
              onClick={() => setControlCenterOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHardwareSpikeMode((p) => !p)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                hardwareSpikeMode
                  ? 'bg-rose-500/25 border-rose-400 text-white'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400 mb-1" />
              <div className="text-xs font-semibold">Stress Spike</div>
              <div className="text-[10px] text-slate-400">
                {hardwareSpikeMode ? 'Active (High Load)' : 'Nominal Clocks'}
              </div>
            </button>

            <button
              onClick={() => setStandaloneModalOpen(true)}
              className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 text-left transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-sky-400 mb-1" />
              <div className="text-xs font-semibold">Single-File HTML</div>
              <div className="text-[10px] text-slate-400">
                Inspect / Copy Source
              </div>
            </button>
          </div>

          {/* Backdrop Blur Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Backdrop Blur</span>
              </span>
              <span className="font-mono-tabular text-sky-300">
                {blurIntensity}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={48}
              value={blurIntensity}
              onChange={(e) => setBlurIntensity(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Display Luminance Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Display Luminance</span>
              </span>
              <span className="font-mono-tabular text-amber-300">
                {displayBrightness}%
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={115}
              value={displayBrightness}
              onChange={(e) => setDisplayBrightness(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Theme Quick Switcher */}
          <div className="pt-1 border-t border-white/10">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Theme Profile
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(THEME_PROFILES) as ThemeProfileId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setThemeId(id)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium capitalize border cursor-pointer ${
                    themeId === id
                      ? 'bg-sky-500/25 border-sky-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          3. DESKTOP WORKSPACE SURFACE & DRAGGABLE GLASS WINDOWS
      ==================================================================== */}
      <main className="relative w-full h-[calc(100vh-2.25rem)] overflow-hidden">
        {(Object.keys(windows) as AppId[]).map((appId) => {
          const win = windows[appId];
          if (!win.isOpen || win.isMinimized) return null;

          const isFocused = focusedApp === appId;

          const windowStyle: React.CSSProperties = win.isMaximized
            ? {
                left: 8,
                top: 8,
                width: 'calc(100vw - 16px)',
                height: 'calc(100vh - 118px)',
                zIndex: win.zIndex,
                background: activeTheme.windowBg,
              }
            : {
                left: win.x,
                top: win.y - 36,
                width: win.width,
                height: win.height,
                zIndex: win.zIndex,
                background: activeTheme.windowBg,
              };

          return (
            <section
              key={appId}
              style={windowStyle}
              onPointerDown={() => focusWindow(appId)}
              className={`ember-glass absolute rounded-2xl overflow-hidden flex flex-col transition-shadow duration-200 ${
                isFocused
                  ? 'ring-1 ring-white/30 shadow-[0_28px_80px_rgba(0,0,0,0.85)]'
                  : 'opacity-95 shadow-[0_14px_40px_rgba(0,0,0,0.5)]'
              }`}
            >
              {/* Native macOS Traffic Light Window Title Bar (Draggable) */}
              <div
                onPointerDown={(e) => handleWindowDragStart(e, appId)}
                onPointerMove={handleWindowDragMove}
                onPointerUp={handleWindowDragEnd}
                onDoubleClick={() => toggleMaximizeAppWindow(appId)}
                style={{ background: activeTheme.windowHeaderBg }}
                className="h-10 px-3.5 border-b border-white/15 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0"
              >
                {/* Left: Traffic Lights (Red Close, Yellow Minimize, Green Maximize) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => closeAppWindow(appId)}
                    title="Close Window & Kill Process"
                    className="group w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5 text-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={() => minimizeAppWindow(appId)}
                    title="Minimize Window to Dock"
                    className="group w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] flex items-center justify-center cursor-pointer"
                  >
                    <Minimize2 className="w-2.5 h-2.5 text-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={() => toggleMaximizeAppWindow(appId)}
                    title="Maximize / Restore Window"
                    className="group w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] flex items-center justify-center cursor-pointer"
                  >
                    <Maximize2 className="w-2.5 h-2.5 text-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                {/* Center: Window Title & Process Subtitle */}
                <div className="flex items-center gap-2 truncate px-2">
                  <span className="text-xs font-semibold text-white truncate">
                    {win.title}
                  </span>
                  <span className="hidden md:inline text-[11px] text-slate-400 font-mono-tabular truncate">
                    — {win.subtitle}
                  </span>
                </div>

                {/* Right: Active Process PID Indicator */}
                <div className="text-[10px] font-mono-tabular text-slate-400 shrink-0">
                  {processes.find((p) => p.appId === appId)
                    ? `PID ${processes.find((p) => p.appId === appId)?.pid}`
                    : 'USER_SPACE'}
                </div>
              </div>

              {/* Window Body Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {renderAppContent(appId)}
              </div>
            </section>
          );
        })}
      </main>

      {/* ====================================================================
          4. FLOATING BOTTOM APPLICATION DOCK WITH MAGNIFICATION CURVE
      ==================================================================== */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[210] px-2">
        <div
          className="ember-dock px-3 py-2 rounded-2xl flex items-end gap-2.5 sm:gap-3.5"
          style={{ background: activeTheme.dockBg }}
        >
          {(
            [
              { id: 'console', icon: TerminalIcon },
              { id: 'finder', icon: FolderOpen },
              { id: 'monitor', icon: Activity },
              { id: 'settings', icon: Sliders },
              { id: 'utility', icon: CalcIcon },
            ] as { id: AppId; icon: React.ComponentType<{ className?: string }> }[]
          ).map(({ id, icon: Icon }) => {
            const meta = APP_METADATA[id];
            const win = windows[id];
            const isRunning = processes.some((p) => p.appId === id);
            const isHovered = dockHoveredApp === id;

            return (
              <div
                key={id}
                className="relative flex flex-col items-center group"
                onMouseEnter={() => setDockHoveredApp(id)}
                onMouseLeave={() => setDockHoveredApp(null)}
              >
                {/* Hover Label Tooltip */}
                <div
                  className={`pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-white/20 text-[11px] font-medium text-white whitespace-nowrap shadow-xl transition-all duration-150 ${
                    isHovered
                      ? 'opacity-100 -translate-y-0.5'
                      : 'opacity-0 translate-y-1'
                  }`}
                >
                  {meta.title}
                </div>

                {/* Dock Icon Button with Smooth Scale Magnification */}
                <button
                  onClick={() => launchOrFocusApp(id)}
                  className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${meta.gradient} border flex items-center justify-center text-white shadow-lg transition-all duration-200 ease-out cursor-pointer hover:scale-125 hover:-translate-y-2 active:scale-95`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
                </button>

                {/* Running Process Indicator Dot */}
                <div className="h-1.5 mt-1 flex items-center justify-center">
                  {isRunning && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        focusedApp === id && win.isOpen && !win.isMinimized
                          ? 'bg-white w-3'
                          : 'bg-white/60'
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Dock Divider */}
          <div className="h-9 w-px bg-white/15 my-auto mx-0.5" />

          {/* Quick Tile Action in Dock for Mobile X11/VNC convenience */}
          <div className="relative flex flex-col items-center group">
            <button
              onClick={tileWindowsLayout}
              title="Tile All Open Windows"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-sky-300 shadow-lg transition-all duration-200 ease-out cursor-pointer hover:scale-115 hover:-translate-y-1.5"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <div className="h-1.5 mt-1" />
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. SINGLE-FILE HTML EXPORT MODAL (OPTIONAL INSPECTOR)
      ==================================================================== */}
      {standaloneModalOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setStandaloneModalOpen(false)}
        >
          <div
            className="ember-glass w-full max-w-2xl rounded-2xl p-4 bg-slate-900/95 text-slate-100 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Ember OS Kernel Snapshot &amp; Single-File Export
                </h3>
                <p className="text-xs text-slate-400">
                  Live state summary for mobile X11/VNC workspaces
                </p>
              </div>
              <button
                onClick={() => setStandaloneModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-black/70 border border-white/10 text-xs font-mono-tabular text-emerald-300 overflow-x-auto max-h-64">
              {standaloneHtmlSource}
            </pre>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(standaloneHtmlSource);
                  setCopiedStandalone(true);
                  setTimeout(() => setCopiedStandalone(false), 2000);
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedStandalone ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied Snapshot</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Header Template</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
