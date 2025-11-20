import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const APIEndpoint = () => {
  const { id, prompt } = useParams();
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponse = async () => {
      try {
        const res = await fetch(`https://gjlxuvcfoqjhwzcmpaju.supabase.co/functions/v1/ai-endpoint/${id}/${encodeURIComponent(prompt || '')}`);
        const text = await res.text();
        setResponse(text);
      } catch (error) {
        setResponse('Error: Failed to fetch response');
      } finally {
        setLoading(false);
      }
    };

    fetchResponse();
  }, [id, prompt]);

  if (loading) {
    return <pre>Loading...</pre>;
  }

  return <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'monospace' }}>{response}</pre>;
};

export default APIEndpoint;
