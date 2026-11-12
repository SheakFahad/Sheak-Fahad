/** Global open event for Fahad's AI Assistant (header button, hero orb, links). */
export const ASSISTANT_EVENT = 'fahad-ai:open'
export const openAssistant = () => window.dispatchEvent(new Event(ASSISTANT_EVENT))
