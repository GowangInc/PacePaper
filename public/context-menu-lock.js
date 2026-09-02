export function installContextMenuGuard(target) {
  const preventContextMenu = (event) => event.preventDefault();
  target.addEventListener("contextmenu", preventContextMenu, true);
  return () => target.removeEventListener("contextmenu", preventContextMenu, true);
}

if (typeof document !== "undefined") installContextMenuGuard(document);
