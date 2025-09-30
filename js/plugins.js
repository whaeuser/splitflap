/**
 * Plugin System for Split-Flap Display
 * Allows extending functionality with custom plugins
 */

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = new Map();
        this.eventListeners = new Map();
    }

    /**
     * Register a plugin
     */
    register(name, plugin) {
        if (this.plugins.has(name)) {
            console.warn(`Plugin "${name}" already registered`);
            return false;
        }

        // Validate plugin
        if (!plugin.name || !plugin.version) {
            console.error(`Plugin "${name}" missing required fields (name, version)`);
            return false;
        }

        // Store plugin
        this.plugins.set(name, {
            ...plugin,
            enabled: false,
            initialized: false
        });

        console.log(`✓ Plugin "${name}" v${plugin.version} registered`);
        return true;
    }

    /**
     * Enable a plugin
     */
    async enable(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            console.error(`Plugin "${name}" not found`);
            return false;
        }

        if (plugin.enabled) {
            console.warn(`Plugin "${name}" already enabled`);
            return true;
        }

        try {
            // Initialize if needed
            if (!plugin.initialized && plugin.init) {
                await plugin.init();
                plugin.initialized = true;
            }

            // Enable
            if (plugin.enable) {
                await plugin.enable();
            }

            plugin.enabled = true;
            console.log(`✓ Plugin "${name}" enabled`);

            // Emit event
            this.emit('plugin:enabled', { name, plugin });

            return true;
        } catch (error) {
            console.error(`Failed to enable plugin "${name}":`, error);
            return false;
        }
    }

    /**
     * Disable a plugin
     */
    async disable(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            console.error(`Plugin "${name}" not found`);
            return false;
        }

        if (!plugin.enabled) {
            return true;
        }

        try {
            if (plugin.disable) {
                await plugin.disable();
            }

            plugin.enabled = false;
            console.log(`✓ Plugin "${name}" disabled`);

            // Emit event
            this.emit('plugin:disabled', { name, plugin });

            return true;
        } catch (error) {
            console.error(`Failed to disable plugin "${name}":`, error);
            return false;
        }
    }

    /**
     * Get plugin
     */
    get(name) {
        return this.plugins.get(name);
    }

    /**
     * List all plugins
     */
    list() {
        return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
            name,
            version: plugin.version,
            description: plugin.description || '',
            enabled: plugin.enabled,
            initialized: plugin.initialized
        }));
    }

    /**
     * Register a hook
     */
    registerHook(hookName, callback, priority = 10) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }

        this.hooks.get(hookName).push({ callback, priority });

        // Sort by priority (lower = earlier)
        this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);
    }

    /**
     * Execute hook
     */
    async executeHook(hookName, data) {
        const hooks = this.hooks.get(hookName);
        if (!hooks || hooks.length === 0) {
            return data;
        }

        let result = data;
        for (const { callback } of hooks) {
            try {
                result = await callback(result);
            } catch (error) {
                console.error(`Hook "${hookName}" failed:`, error);
            }
        }

        return result;
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (!this.eventListeners.has(event)) return;
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Emit event
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (!listeners) return;

        for (const callback of listeners) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Event "${event}" listener failed:`, error);
            }
        }
    }
}

// Export singleton instance
export const pluginManager = new PluginManager();

// Export base plugin class
export class Plugin {
    constructor(name, version, description = '') {
        this.name = name;
        this.version = version;
        this.description = description;
    }

    /**
     * Initialize plugin (called once)
     */
    async init() {
        // Override in subclass
    }

    /**
     * Enable plugin
     */
    async enable() {
        // Override in subclass
    }

    /**
     * Disable plugin
     */
    async disable() {
        // Override in subclass
    }

    /**
     * Cleanup on unload
     */
    async destroy() {
        // Override in subclass
    }
}