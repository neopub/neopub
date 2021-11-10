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
      <div className="flex flex-row space-x-4">
        {
          tabs.map((tab) => {
            const isActive = tab.name === activeTab;
            return <h2 className={`mb-3 cursor-pointer hover:text-green-200 hover:underline ${isActive ? "underline" : undefined}`} onClick={() => setActiveTab(tab.name)}>{tab.name}</h2>
          })
        }
      </div>
      {activeEl}
    </>
  )
}