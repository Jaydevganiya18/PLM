import { create } from 'zustand';
import api from '../utils/api';

const useEcoStore = create((set, get) => ({
  ecos: [],
  loading: false,

  fetchEcos: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/ecos');
      set({ ecos: data, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch ECOs', error);
    }
  },

  // Optimistic UI update for submission
  submitEcoOptimistic: async (ecoId, riskAcknowledged = false) => {
    const previousEcos = get().ecos;
    
    // Optimistically update
    set({
      ecos: previousEcos.map(eco => 
        eco.id === ecoId ? { ...eco, stage: 'Approval' } : eco
      )
    });

    try {
      await api.patch(`/ecos/${ecoId}/submit`, { risk_acknowledged: riskAcknowledged });
    } catch (error) {
      // Revert if failed
      set({ ecos: previousEcos });
      throw error; // Let component handle error toast/shake
    }
  },

  updateEco: (updatedEco) => {
    set({
      ecos: get().ecos.map(eco => eco.id === updatedEco.id ? updatedEco : eco)
    });
  },
  
  addEco: (newEco) => {
    set({
      ecos: [newEco, ...get().ecos]
    });
  }
}));

export default useEcoStore;
