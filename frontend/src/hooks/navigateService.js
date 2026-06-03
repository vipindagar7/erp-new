let _navigate = null;

export const setNavigate = (fn) => { _navigate = fn; };
export const navigateTo = (path) => { if (_navigate) _navigate(path); };
