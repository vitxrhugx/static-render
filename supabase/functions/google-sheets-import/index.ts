const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Google Sheets public export as CSV
// Works with sheets that have "Anyone with the link can view" permission
function extractSheetId(url: string): string | null {
  // Match patterns like:
  // https://docs.google.com/spreadsheets/d/SHEET_ID/edit
  // https://docs.google.com/spreadsheets/d/SHEET_ID/
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, sheetName, sheetIndex } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Google Sheets URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sheetId = extractSheetId(url);
    if (!sheetId) {
      return new Response(
        JSON.stringify({ error: 'Invalid Google Sheets URL. Use the sharing link from Google Sheets.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build export URL
    const gid = sheetIndex || 0;
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    console.log('Fetching Google Sheet:', exportUrl);

    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Climatch/1.0',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Planilha não encontrada. Verifique o link.');
      }
      if (response.status === 403) {
        throw new Error('Sem permissão. A planilha precisa estar compartilhada como "Qualquer pessoa com o link pode visualizar".');
      }
      throw new Error(`Erro ao acessar a planilha: ${response.status}`);
    }

    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'A planilha deve conter pelo menos cabeçalho e dados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse headers and data
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    console.log(`Parsed ${data.length} rows from Google Sheet`);

    return new Response(
      JSON.stringify({ 
        success: true,
        headers,
        data,
        rowCount: data.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Google Sheets import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
