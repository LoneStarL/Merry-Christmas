import { create } from 'zustand';

const useStore = create((set) => ({
    phase: 'tree', // 'tree', 'blooming', 'nebula', 'collapsing'
    mousePosition: { x: 0, y: 0 },
    selectedPhoto: null,
    carouselRotation: 0,
    
    setPhase: (phase) => set({ phase }),
    setMousePosition: (mousePosition) => set({ mousePosition }),
    setSelectedPhoto: (selectedPhoto) => set({ selectedPhoto }),
    setCarouselRotation: (carouselRotation) => set({ carouselRotation }),
    
    // 便捷方法
    triggerBlooming: () => set({ phase: 'blooming' }),
    triggerNebula: () => set({ phase: 'nebula' }),
    triggerCollapsing: () => set({ phase: 'collapsing' }),
    triggerTree: () => set({ phase: 'tree' })
}));

// 直接访问 store 的方法（非 React 环境使用）
const store = {
    getState: useStore.getState,
    setState: useStore.setState,
    subscribe: useStore.subscribe,
    
    // 导出所有 action 方法
    setPhase: (phase) => useStore.setState({ phase }),
    setMousePosition: (mousePosition) => useStore.setState({ mousePosition }),
    setSelectedPhoto: (selectedPhoto) => useStore.setState({ selectedPhoto }),
    setCarouselRotation: (carouselRotation) => useStore.setState({ carouselRotation }),
    
    // 便捷方法
    triggerBlooming: () => useStore.setState({ phase: 'blooming' }),
    triggerNebula: () => useStore.setState({ phase: 'nebula' }),
    triggerCollapsing: () => useStore.setState({ phase: 'collapsing' }),
    triggerTree: () => useStore.setState({ phase: 'tree' })
};

export default useStore;
export { store };