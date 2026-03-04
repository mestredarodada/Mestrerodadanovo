import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export function useAdmin(password: string) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticateMutation = trpc.admin.authenticate.useMutation();
  const { data: predictionsData, isLoading: isLoadingPredictions, refetch: refetchPredictions, error: predictionsError } = trpc.admin.getAllPredictions.useQuery({ password }, { enabled: isAuthenticated });
  const publishPredictionMutation = trpc.admin.publishPrediction.useMutation();
  const unpublishPredictionMutation = trpc.admin.unpublishPrediction.useMutation();
  const deletePredictionMutation = trpc.admin.deletePrediction.useMutation();
  const generateNewPredictionsMutation = trpc.admin.generateNewPredictions.useMutation();

  const authenticate = async (pwd: string) => {
    try {
      const result = await authenticateMutation.mutateAsync({ password: pwd });
      if (result.isValid) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  };

  const getAllPredictions = async () => {
    try {
      const result = await refetchPredictions();
      return result.data || [];
    } catch (error) {
      console.error("Failed to load predictions:", error);
      return [];
    }
  };

  const publishPrediction = async (predictionId: number) => {
    try {
      await publishPredictionMutation.mutateAsync({ password, predictionId });
      return true;
    } catch (error) {
      console.error('Failed to publish prediction:', error);
      return false;
    }
  };

  const unpublishPrediction = async (predictionId: number) => {
    try {
      await unpublishPredictionMutation.mutateAsync({ password, predictionId });
      return true;
    } catch (error) {
      console.error('Failed to unpublish prediction:', error);
      return false;
    }
  };

  const deletePrediction = async (predictionId: number) => {
    try {
      await deletePredictionMutation.mutateAsync({ password, predictionId });
      return true;
    } catch (error) {
      console.error('Failed to delete prediction:', error);
      return false;
    }
  };

  const generateNewPredictions = async () => {
    try {
      const result = await generateNewPredictionsMutation.mutateAsync({ password });
      return result;
    } catch (error) {
      console.error('Failed to generate predictions:', error);
      throw error;
    }
  };

  return {
    isAuthenticated,
    authenticate,
    getAllPredictions,
    publishPrediction,
    unpublishPrediction,
    deletePrediction,
    generateNewPredictions,
    isLoading: isLoadingPredictions,
    isGenerating: generateNewPredictionsMutation.isPending,
  };
}
