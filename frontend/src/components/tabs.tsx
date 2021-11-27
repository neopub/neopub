import { useState } from "react";


export function TabBar({ tabs, activeTab, onTabSelected }: { tabs: string[], activeTab: string, onTabSelected: (tab: string) => void }) {
  return (
    <div className="flex flex-row text-center overflow-auto">
      {
        tabs.map((tab) => {
          const isActive = tab === activeTab;
          return <h2 key={tab} className={`mb-3 p-3 flex-1 cursor-pointer hover:bg-gray-800 hover:text-green-200 hover:underline ${isActive ? "underline bg-gray-800" : undefined}`} onClick={() => onTabSelected(tab)} style={{ textUnderlineOffset: 2 }}>{tab}</h2>
        })
      }
    </div>
  )
}

export interface ITab {
  name: string;
  el: React.ReactElement;
}

export default function Tabs({ tabs, initialActiveTab }: { tabs: ITab[], initialActiveTab: string }) {
  const [activeTab, setActiveTab] = useState(initialActiveTab);

  const activeEl = tabs.filter(tab => tab.name === activeTab)?.[0]?.el;
  return (
    <>
      <TabBar tabs={tabs.map(t => t.name)} activeTab={activeTab} onTabSelected={(t) => setActiveTab(t)} />
      {activeEl}
    </>
  )
}