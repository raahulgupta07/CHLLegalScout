const AgentThinkingLoader = () => (
  <div className="flex flex-col gap-1 font-brutalist">
    <div className="flex items-center gap-1.5">
      <span className="text-[#00fc40] text-xs font-bold">&gt;</span>
      <span className="text-[#e8e8d8]/50 text-xs font-bold">connecting</span>
      <span className="inline-flex gap-[3px]">
        <span className="inline-block size-[5px] bg-[#00fc40] animate-[cliBlink_1.2s_infinite_0s]" />
        <span className="inline-block size-[5px] bg-[#ff9d00] animate-[cliBlink_1.2s_infinite_0.2s]" />
        <span className="inline-block size-[5px] bg-[#be2d06] animate-[cliBlink_1.2s_infinite_0.4s]" />
      </span>
    </div>
    <span className="inline-block w-[8px] h-[14px] bg-[#00fc40] animate-[cursorBlink_1s_step-end_infinite]" />
  </div>
)

export default AgentThinkingLoader
