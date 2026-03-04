import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Trash2, Send, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const admin = useAdmin(password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const isValid = await admin.authenticate(password);
    if (isValid) {
      setMessage({ type: 'success', text: 'Autenticado com sucesso!' });
      loadPredictions();
    } else {
      setMessage({ type: 'error', text: 'Senha incorreta' });
    }
    setIsLoading(false);
  };

  const loadPredictions = async () => {
    setIsLoading(true);
    const data = await admin.getAllPredictions();
    setPredictions(data);
    setIsLoading(false);
  };

  const handlePublish = async (id: number) => {
    setIsLoading(true);
    const success = await admin.publishPrediction(id);
    if (success) {
      setMessage({ type: 'success', text: 'Palpite publicado e enviado para o Telegram!' });
      loadPredictions();
    } else {
      setMessage({ type: 'error', text: 'Erro ao publicar palpite' });
    }
    setIsLoading(false);
  };

  const handleUnpublish = async (id: number) => {
    setIsLoading(true);
    const success = await admin.unpublishPrediction(id);
    if (success) {
      setMessage({ type: 'success', text: 'Palpite despublicado' });
      loadPredictions();
    } else {
      setMessage({ type: 'error', text: 'Erro ao despublicar palpite' });
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este palpite?')) {
      setIsLoading(true);
      const success = await admin.deletePrediction(id);
      if (success) {
        setMessage({ type: 'success', text: 'Palpite deletado' });
        loadPredictions();
      } else {
        setMessage({ type: 'error', text: 'Erro ao deletar palpite' });
      }
      setIsLoading(false);
    }
  };

  if (!admin.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="w-12 h-12 text-amber-500" />
            </div>
            <CardTitle className="text-white">Painel do Mestre</CardTitle>
            <CardDescription>Digite sua senha para acessar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {message && (
                <Alert className={message.type === 'error' ? 'bg-red-900 border-red-700' : 'bg-green-900 border-green-700'}>
                  <AlertDescription className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>
                    {message.text}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Autenticando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🏆 Painel do Mestre</h1>
            <p className="text-slate-400">Gerencie e publique os palpites</p>
          </div>
          <Button
            onClick={() => {
              admin.isAuthenticated && setPassword('');
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Sair
          </Button>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'bg-red-900 border-red-700' : 'bg-green-900 border-green-700'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {isLoading && predictions.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <p className="text-slate-400">Carregando palpites...</p>
              </CardContent>
            </Card>
          ) : predictions.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <p className="text-slate-400">Nenhum palpite disponível</p>
              </CardContent>
            </Card>
          ) : (
            predictions.map((pred) => (
              <Card key={pred.id} className={`bg-slate-800 border-l-4 ${pred.isPublished ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">
                        {pred.homeTeamName} vs {pred.awayTeamName}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(pred.matchDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {pred.isPublished ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-400">Vencedor</p>
                      <p className="text-white font-bold">{pred.mainPrediction}</p>
                      <p className="text-xs text-slate-400">{pred.mainConfidence}</p>
                    </div>
                    <div className="bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-400">Gols</p>
                      <p className="text-white font-bold">{pred.goalsPrediction}</p>
                      <p className="text-xs text-slate-400">{pred.goalsConfidence}</p>
                    </div>
                    {pred.cornersPrediction && (
                      <div className="bg-slate-700 p-3 rounded">
                        <p className="text-xs text-slate-400">Escanteios</p>
                        <p className="text-white font-bold">{pred.cornersPrediction}</p>
                      </div>
                    )}
                    {pred.cardsPrediction && (
                      <div className="bg-slate-700 p-3 rounded">
                        <p className="text-xs text-slate-400">Cartões</p>
                        <p className="text-white font-bold">{pred.cardsPrediction}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-xs text-slate-400 mb-1">Justificativa</p>
                    <p className="text-white text-sm">{pred.justification}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {pred.isPublished ? (
                      <Button
                        onClick={() => handleUnpublish(pred.id)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isLoading}
                      >
                        Despublicar
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => handlePublish(pred.id)}
                          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                          disabled={isLoading}
                        >
                          <Send className="w-4 h-4" />
                          Publicar & Enviar
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => handleDelete(pred.id)}
                      className="bg-red-900 hover:bg-red-800 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
