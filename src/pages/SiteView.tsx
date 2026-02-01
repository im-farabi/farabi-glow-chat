import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const SiteView = () => {
  const { '*': slug } = useParams();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!slug) {
        setError('No website specified');
        setLoading(false);
        return;
      }

      try {
        // Query the website by slug
        const { data, error: fetchError } = await supabase
          .from('user_websites')
          .select('html_content, title, views_count')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (fetchError || !data) {
          console.error('Website not found:', fetchError);
          setError('Website not found');
          setLoading(false);
          return;
        }

        // Increment view count
        await supabase
          .from('user_websites')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('slug', slug);

        // Set page title
        if (data.title) {
          document.title = data.title;
        }

        setHtml(data.html_content);
      } catch (err) {
        console.error('Error fetching website:', err);
        setError('Failed to load website');
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-white/50 mx-auto" />
          <p className="text-white/60">Loading website...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <h1 className="text-2xl font-bold text-white">Website Not Found</h1>
          <p className="text-white/60">{error}</p>
          <a 
            href="/web" 
            className="inline-block mt-4 px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            Create Your Own Website
          </a>
        </div>
      </div>
    );
  }

  if (!html) {
    return null;
  }

  // Render the website full-screen
  return (
    <iframe 
      srcDoc={html}
      className="w-screen h-screen border-0"
      title="Published Website"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
};

export default SiteView;
