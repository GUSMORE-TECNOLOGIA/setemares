const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Servir arquivos estáticos da pasta public
app.use(express.static('public'));

// Rota de teste
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Teste 7Mares</title>
      <style>
        body { 
          background: #1a1a1a; 
          color: white; 
          font-family: Arial; 
          padding: 20px; 
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
        }
        .status { 
          background: #22c55e; 
          padding: 10px; 
          border-radius: 5px; 
          margin: 10px 0; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 7Mares Cotador - Teste</h1>
        <div class="status">✅ Servidor funcionando na porta ${PORT}</div>
        <p>Se você está vendo esta página, o servidor está funcionando!</p>
        <p>Agora vamos testar o Vite...</p>
        <button onclick="testVite()">Testar Vite</button>
        <div id="result"></div>
      </div>
      
      <script>
        function testVite() {
          fetch('http://localhost:5173')
            .then(response => {
              document.getElementById('result').innerHTML = 
                '<div style="background: #22c55e; padding: 10px; margin: 10px 0; border-radius: 5px;">✅ Vite está rodando!</div>';
            })
            .catch(error => {
              document.getElementById('result').innerHTML = 
                '<div style="background: #ef4444; padding: 10px; margin: 10px 0; border-radius: 5px;">❌ Vite não está rodando: ' + error.message + '</div>';
            });
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🧪 Servidor de teste rodando em http://localhost:${PORT}`);
  console.log('Acesse para verificar se o servidor básico funciona');
});
