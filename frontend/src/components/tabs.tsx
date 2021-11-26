import { useState } from "react";

export interface ITab {
  name: string;
  el: React.ReactElement;
}

export default function Tabs({ tabs, initialActiveTab }: { tabs: ITab[], initialActiveTab: string }) {
  const [activeTab, setActiveTab] = useState(initialActiveTab);

  const activeEl = tabs.filter(tab => tab.name === activeTab)?.[0]?.el;
  return (
    <>
      <div className="flex flex-row text-center overflow-auto">
        {
          tabs.map((tab) => {
            const isActive = tab.name === activeTab;
            return <h2 key={tab.name} className={`mb-3 p-3 flex-1 cursor-pointer hover:bg-gray-800 hover:text-green-200 hover:underline ${isActive ? "underline" : undefined}`} onClick={() => setActiveTab(tab.name)} style={{ textUnderlineOffset: 2 }}>{tab.name}</h2>
          })
        }
      </div>
      {activeEl}
    </>
  )
}