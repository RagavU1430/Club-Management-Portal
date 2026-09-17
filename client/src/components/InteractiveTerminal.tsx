import { useState, useRef, useEffect } from "react";
import { Terminal, CornerDownLeft, Sparkles, Check, Copy } from "lucide-react";

interface CommandLog {
  command: string;
  output: React.ReactNode;
  timestamp: string;
}

const PRESET_COMMANDS = [
  { cmd: "status", label: "system status" },
  { cmd: "ai-model", label: "test AI model" },
  { cmd: "events", label: "upcoming summits" },
  { cmd: "join", label: "how to join" },
];

export default function InteractiveTerminal() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<CommandLog[]>([
    {
      command: "ai-frontier init",
      output: (
        <div className="space-y-1 text-slate-300">
          <p className="text-cyan-400 font-bold">⚡ AI FRONTIER LABS // CORE v3.4.1 CONNECTED</p>
          <p className="text-slate-400">Environment: Collegiate AI & Data Science Cluster</p>
          <p className="text-slate-400">Type a command or click a quick tag below to test simulated intelligence agents.</p>
        </div>
      ),
      timestamp: "19:00:01",
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const executeCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim().toLowerCase();
    if (!trimmed) return;

    const time = new Date().toLocaleTimeString();
    let output: React.ReactNode = null;

    if (trimmed === "clear") {
      setHistory([]);
      setInput("");
      return;
    } else if (trimmed.includes("status")) {
      output = (
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="text-emerald-400">✓ Guild Operational: 500+ Active Student Innovators & Developers</p>
          <p className="text-cyan-300">✓ Core Focus: Machine Learning, Deep Learning, Generative AI, Computer Vision</p>
          <p className="text-purple-300">✓ Hands-on Learning: Student Hackathons, Code Sprints & Bootcamps</p>
          <p className="text-slate-400">✓ Next Summit: Annual Collegiate AI Hackathon & Model Showcase</p>
        </div>
      );
    } else if (trimmed.includes("ai-model") || trimmed.includes("model")) {
      output = (
        <div className="space-y-2 text-xs sm:text-sm bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/20">
          <p className="text-cyan-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            [NEURAL INFERENCE: VISION-LANGUAGE AGENT]
          </p>
          <p className="text-slate-300">
            Prompt: "Fine-tune multimodal transformer on custom collegiate robotics dataset"
          </p>
          <p className="text-emerald-400 font-mono">
            &gt; Training Loss: 0.042 | Epoch 50/50 | Accuracy: 98.9%
          </p>
          <p className="text-slate-400 text-xs">
            Model Artifact: PyTorch checkpoint generated and ready for edge robotics deployment.
          </p>
        </div>
      );
    } else if (trimmed.includes("events")) {
      output = (
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="text-cyan-300 font-semibold">&gt; UPCOMING CLUB GATHERINGS:</p>
          <p className="text-slate-300">1. 48-Hour Generative AI Hackathon — 2026</p>
          <p className="text-slate-300">2. Hands-on PyTorch & Deep Learning Bootcamp</p>
          <p className="text-slate-300">3. Autonomous Agents & Computer Vision Workshop</p>
          <p className="text-slate-500 text-xs mt-1">Navigate to the Events page for instant registration.</p>
        </div>
      );
    } else if (trimmed.includes("join")) {
      output = (
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="text-purple-300 font-semibold">&gt; MEMBERSHIP PROTOCOL:</p>
          <p className="text-slate-300">1. Attend any public workshop, hackathon, or code sprint (zero prerequisites).</p>
          <p className="text-slate-300">2. Join our open student Discord and collaborate on AI projects.</p>
          <p className="text-slate-300">3. Fork our repositories on GitHub and submit code to earn builder credentials.</p>
        </div>
      );
    } else if (trimmed.includes("help")) {
      output = (
        <div className="space-y-1 text-xs sm:text-sm text-slate-300">
          <p className="text-cyan-400">Available commands:</p>
          <p><span className="text-white font-mono">status</span> — Check club status and active metrics</p>
          <p><span className="text-white font-mono">ai-model</span> — Test live neural model inference</p>
          <p><span className="text-white font-mono">events</span> — List upcoming hackathons & workshops</p>
          <p><span className="text-white font-mono">join</span> — How to join AI Frontier Club</p>
          <p><span className="text-white font-mono">clear</span> — Clear terminal output</p>
        </div>
      );
    } else {
      output = (
        <p className="text-amber-400 text-xs sm:text-sm">
          Command not recognized: "{cmdStr}". Type <span className="text-white font-mono">help</span> or click one of the quick commands below.
        </p>
      );
    }

    setHistory((prev) => [
      ...prev,
      {
        command: `ai-frontier ${cmdStr}`,
        output,
        timestamp: time,
      },
    ]);
    setInput("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("npx ai-frontier-club join");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl border border-cyan-400/20 bg-[#070b16]/95 backdrop-blur-xl shadow-[0_0_50px_rgba(0,240,255,0.08)] overflow-hidden">
      {/* Terminal Top Chrome */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/80" />
          <div className="h-3 w-3 rounded-full bg-amber-500/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 font-mono text-xs text-slate-400 flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            ai-frontier-cli // interactive node
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition"
          title="Copy CLI install command"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied" : "npx ai-frontier"}</span>
        </button>
      </div>

      {/* Terminal Body */}
      <div className="h-72 sm:h-80 overflow-y-auto p-4 sm:p-5 font-mono text-xs sm:text-sm space-y-4">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-cyan-400 font-bold">&gt;</span>
              <span className="text-white font-medium">{item.command}</span>
              <span className="ml-auto text-[10px] text-slate-600">{item.timestamp}</span>
            </div>
            <div className="pl-4">{item.output}</div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Quick Clickable Suggestions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 bg-white/[0.01] px-4 py-2 text-xs font-mono">
        <span className="text-slate-500 text-[11px]">Quick actions:</span>
        {PRESET_COMMANDS.map((item) => (
          <button
            key={item.cmd}
            onClick={() => executeCommand(item.cmd)}
            className="rounded-md bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 px-2.5 py-1 text-slate-300 hover:text-cyan-300 transition text-[11px]"
          >
            {item.cmd}
          </button>
        ))}
      </div>

      {/* Input Prompt Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeCommand(input);
        }}
        className="flex items-center gap-2 border-t border-white/10 bg-[#050811] px-4 py-2.5"
      >
        <span className="text-cyan-400 font-mono font-bold">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type 'help', 'status', 'ai-model' or 'events'..."
          className="flex-1 bg-transparent font-mono text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-cyan-400/20 hover:bg-cyan-400 border border-cyan-400/40 hover:border-cyan-400 p-1.5 text-cyan-300 hover:text-black transition"
          aria-label="Send command"
        >
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
