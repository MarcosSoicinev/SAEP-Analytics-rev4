# SAEP Analytics

Dashboard analítico para visualização dos resultados do SAEP (Sistema de Avaliação da Educação Profissional) do SENAI.

## Como usar

1. Acesse o dashboard pelo GitHub Pages
2. Clique em **Importar Planilha** e selecione o arquivo `.xlsx` exportado do SAEP
3. Os dados são processados localmente no navegador — nenhum dado é enviado para servidores

## Páginas

| Página | Descrição |
|---|---|
| `index.html` | Visão geral da turma — KPIs, capacidades, ranking |
| `aluno.html` | Boletim individual por aluno |
| `analise.html` | Análise profunda — heatmap, distratores, clusters, plano de ação |

## Estrutura

```
SAEP-Analytics/
├── index.html          # Página principal (visão da turma)
├── aluno.html          # Boletim do aluno
├── analise.html        # Análise profunda
├── style.css           # Estilos globais
├── .nojekyll           # Necessário para GitHub Pages
├── js/
│   ├── app.js
│   ├── constants.js
│   ├── state.js
│   ├── utils.js
│   ├── storage-service.js
│   ├── spreadsheet-service.js
│   ├── saep-service.js
│   ├── chart-ui.js
│   ├── dashboard-ui.js
│   ├── student-ui.js
│   ├── analise-ui.js
│   └── upload-controller.js
└── imagens/
```

## GitHub Pages

Para ativar o GitHub Pages:
1. Vá em **Settings → Pages**
2. Em **Source**, selecione `Deploy from a branch`
3. Selecione a branch `main` e a pasta `/ (root)`
4. Clique em **Save**

O arquivo `.nojekyll` na raiz garante que os arquivos `.js` sejam servidos corretamente.

## Cursos suportados

- Técnico em Automação Industrial
- Técnico em Eletromecânica
- Técnico em Eletrotécnica
- Técnico em Mecânica
- Técnico em Mecatrônica

O curso é **detectado automaticamente** a partir da planilha importada.
