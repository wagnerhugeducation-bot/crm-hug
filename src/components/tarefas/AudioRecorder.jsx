import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AudioRecorder({ onTranscription }) {
  const [status, setStatus] = useState('idle'); // idle | recording | processing | done
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    chunksRef.current = [];
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Permissão para microfone negada. Habilite o acesso ao microfone nas configurações do navegador.');
      } else {
        toast.error('Não foi possível acessar o microfone.');
      }
      setStatus('idle');
      return;
    }
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setStatus('processing');
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], 'gravacao.webm', { type: 'audio/webm' });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const transcription = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });

      if (transcription) {
        onTranscription(transcription);
        setStatus('done');
        toast.success('Áudio transcrito com sucesso!');
      } else {
        toast.error('Não foi possível transcrever o áudio.');
        setStatus('idle');
      }
    };

    mediaRecorder.start();
    setStatus('recording');
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleClick = () => {
    if (status === 'idle' || status === 'done') startRecording();
    else if (status === 'recording') stopRecording();
  };

  const labels = {
    idle: 'Gravar resultado',
    recording: 'Parar gravação',
    processing: 'Transcrevendo...',
    done: 'Gravar novamente',
  };

  const icons = {
    idle: <Mic className="w-4 h-4" />,
    recording: <MicOff className="w-4 h-4 animate-pulse" />,
    processing: <Loader2 className="w-4 h-4 animate-spin" />,
    done: <CheckCircle2 className="w-4 h-4" />,
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={status === 'processing'}
      onClick={handleClick}
      className={cn(
        'gap-2 text-sm transition-all',
        status === 'recording' && 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100',
        status === 'done' && 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100'
      )}
    >
      {icons[status]}
      {labels[status]}
    </Button>
  );
}