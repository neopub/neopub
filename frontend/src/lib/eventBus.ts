type EventListener = () => void;

export default class EventBus {
  listeners = new Set<EventListener>();

  on(l: EventListener) {
    this.listeners.add(l);
  }

  off (l: EventListener) {
    this.listeners.delete(l);
  }

  emit() {
    this.listeners.forEach(l => l());
  }
}