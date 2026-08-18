// src/hooks/useUIPermissions.js
// Every page uses this to show/hide/disable buttons.
// Root admin always sees everything — no restrictions ever apply.
// Cache is module-level: fetched once per page load, invalidated
// after root admin changes permissions.
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../lib/axios.js";
import { EP } from "../config/api.config.js";

let _cache     = null;   // { "students": { "add": { is_hidden: true, is_disabled: false } } }
let _fetching  = null;   // in-flight promise — prevents parallel fetches

/**
 * useUIPermissions(module)
 *
 * @param {string} module  - e.g. "students", "faculty", "groups"
 * @returns {{ isHidden, isDisabled, canShow, loading }}
 *
 * Usage:
 *   const { canShow, isDisabled } = useUIPermissions("students");
 *   {canShow("add")     && <Button>Add Student</Button>}
 *   <Button disabled={isDisabled("export")}>Export</Button>
 */
export const useUIPermissions = (module) => {
  const { user } = useSelector((s) => s.auth);
  const isRoot = user?.is_root === true;

  const [permMap, setPermMap] = useState(_cache || {});
  const [loading, setLoading] = useState(!_cache && !isRoot);

  useEffect(() => {
    // Root admin skips fetch entirely — they always have full access
    if (isRoot) { setLoading(false); return; }

    // Already cached — use immediately
    if (_cache) { setPermMap(_cache); setLoading(false); return; }

    // Kick off a single fetch; all hooks share the same promise
    if (!_fetching) {
      _fetching = axiosInstance
        .get(EP.uiPermissions.map, { params: { role: user?.role } })
        .then((r) => { _cache = r.data?.data || {}; return _cache; })
        .catch(() => ({}))
        .finally(() => { _fetching = null; });
    }

    _fetching.then((map) => { setPermMap(map); setLoading(false); });
  }, [user?.role, isRoot]);

  /** Returns true if the button should be completely hidden for this role */
  const isHidden = useCallback(
    (action) => {
      if (isRoot) return false;
      return permMap?.[module]?.[action]?.is_hidden === true;
    },
    [permMap, module, isRoot],
  );

  /** Returns true if the button should be visible but non-clickable */
  const isDisabled = useCallback(
    (action) => {
      if (isRoot) return false;
      return permMap?.[module]?.[action]?.is_disabled === true;
    },
    [permMap, module, isRoot],
  );

  /** Convenience: true if NOT hidden (button should render at all) */
  const canShow = useCallback((action) => !isHidden(action), [isHidden]);

  return { isHidden, isDisabled, canShow, loading, permMap };
};

/**
 * Call this after root admin saves a change in UIPermissionsPage
 * so that all other pages re-fetch on their next render.
 */
export const invalidateUIPermissionCache = () => {
  _cache    = null;
  _fetching = null;
};