let booted = false
/** true once the first-load splash has finished, so later mounts of a screen can skip the long entrance hold */
export const isBooted = () => booted
export const setBooted = () => { booted = true }
