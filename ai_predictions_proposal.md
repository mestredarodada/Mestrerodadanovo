# Proposta de Estrutura para Palpites de IA do Mestre da Rodada

## 1. Visão Geral

Esta proposta detalha a arquitetura e o fluxo de trabalho para a implementação de um sistema de palpites de futebol baseado em Inteligência Artificial (IA) no WebApp "Mestre da Rodada". O objetivo é fornecer previsões informadas e justificadas para os jogos do Brasileirão Série A, utilizando dados estatísticos e tendências de mercado. [1]

## 2. Fontes de Dados

Para gerar palpites precisos, o sistema integrará informações de diversas fontes:

*   **API Football-Data.org**: Fornecerá dados estatísticos fundamentais, como:
    *   Classificação atual dos times.
    *   Próximos jogos e resultados recentes.
    *   Estatísticas de desempenho por time (gols marcados, gols sofridos, vitórias, empates, derrotas).
    *   Histórico de confrontos diretos (Head-to-Head - H2H) entre as equipes.

*   **Busca Web (Simulada/LLM)**: Para capturar informações dinâmicas e contextuais que influenciam as probabilidades de um jogo, tais como:
    *   **Odds de Apostas**: Probabilidades de vitória do mandante, empate, vitória do visitante (1X2), Over/Under de gols, e Ambas Marcam (BTTS) de casas de apostas renomadas. [2]
    *   **Notícias e Desfalques**: Informações sobre lesões de jogadores chave, suspensões, mudanças táticas ou problemas internos que possam afetar o desempenho das equipes.
    *   **Opiniões de Especialistas**: Análises pré-jogo de portais esportivos e analistas de apostas.

## 3. Estrutura de Dados de Entrada para a IA

Para cada jogo a ser analisado, a IA receberá um conjunto estruturado de dados. Este conjunto será montado a partir das fontes mencionadas e servirá como base para a geração do palpite. Abaixo, um exemplo da estrutura de dados para um jogo:

```json
{
  "matchId": "[ID_DO_JOGO]",
  "homeTeam": {
    "name": "[Nome do Time da Casa]",
    "shortName": "[Nome Curto do Time da Casa]",
    "crest": "[URL do Escudo]",
    "standing": {
      "position": "[Posição na Tabela]",
      "points": "[Pontos]",
      "playedGames": "[Jogos Jogados]",
      "form": "[Forma Recente: Ex: V-E-D-V-V]",
      "goalsFor": "[Gols Pró]",
      "goalsAgainst": "[Gols Contra]"
    }
  },
  "awayTeam": {
    "name": "[Nome do Time Visitante]",
    "shortName": "[Nome Curto do Time Visitante]",
    "crest": "[URL do Escudo]",
    "standing": {
      "position": "[Posição na Tabela]",
      "points": "[Pontos]",
      "playedGames": "[Jogos Jogados]",
      "form": "[Forma Recente: Ex: V-V-E-D-E]",
      "goalsFor": "[Gols Pró]",
      "goalsAgainst": "[Gols Contra]"
    }
  },
  "matchDetails": {
    "utcDate": "[Data e Hora UTC]",
    "matchday": "[Rodada]",
    "venue": "[Estádio]",
    "referee": "[Árbitro]"
  },
  "marketTrends": {
    "odds1X2": {
      "homeWin": "[Odd Vitória Casa]",
      "draw": "[Odd Empate]",
      "awayWin": "[Odd Vitória Fora]"
    },
    "overUnder2_5": {
      "over": "[Odd Over 2.5]",
      "under": "[Odd Under 2.5]"
    },
    "bothTeamsToScore": {
      "yes": "[Odd Ambas Marcam Sim]",
      "no": "[Odd Ambas Marcam Não]"
    },
    "keyNews": "[Resumo de notícias relevantes: desfalques, motivação, etc.]"
  },
  "h2h": [
    // Últimos 5 confrontos diretos
    {
      "date": "[Data]",
      "homeTeam": "[Nome Time Casa H2H]",
      "awayTeam": "[Nome Time Fora H2H]",
      "score": "[Placar: Ex: 2-1]"
    }
  ]
}
```

## 4. Processamento pela IA (LLM)

O Large Language Model (LLM), como Gemini ou GPT-4o-mini (já configurados no ambiente e sem custos adicionais), será o "cérebro" por trás dos palpites. Ele receberá a estrutura de dados acima e será instruído a:

1.  **Analisar Estatísticas**: Avaliar a posição na tabela, forma recente, desempenho ofensivo e defensivo de ambos os times.
2.  **Interpretar Odds**: Identificar o favoritismo do mercado e possíveis "apostas de valor" onde a probabilidade real (inferida pelos dados) supera a odd oferecida. [3]
3.  **Considerar Contexto**: Levar em conta desfalques, motivação e o fator mando de campo.
4.  **Gerar Palpite Estruturado**: Produzir um palpite claro e conciso, dividido em categorias, e uma justificativa detalhada.

## 5. Formato de Saída do Palpite (Dica do Mestre)

O resultado da análise da IA será apresentado ao usuário em um formato amigável e informativo, ideal para ser exibido no card "Palpites do Mestre":

```json
{
  "match": "[Time Casa] vs [Time Fora]",
  "date": "[Data do Jogo]",
  "mainPrediction": {
    "type": "Vencedor do Confronto",
    "value": "[Time Casa / Empate / Time Fora]",
    "confidence": "[Alta/Média/Baixa]"
  },
  "goalsPrediction": {
    "type": "Total de Gols",
    "value": "[Over/Under X.X Gols]",
    "confidence": "[Alta/Média/Baixa]"
  },
  "extraTip": {
    "type": "Dica Extra",
    "value": "[Ex: Ambas Marcam SIM, Mais de X Cartões, Mais de Y Escanteios]",
    "confidence": "[Alta/Média/Baixa]"
  },
  "justification": "[Parágrafo explicando o raciocínio do Mestre, com base nos dados e tendências. Ex: 'O time da casa vem em excelente fase e tem um histórico forte contra o adversário, que possui desfalques importantes no ataque. As odds refletem um bom valor para a vitória do mandante, e esperamos um jogo com mais de 2.5 gols devido ao seu poder ofensivo.']"
}
```

## 6. Fluxo de Automação

O processo será totalmente automatizado, desde a coleta de dados até a exibição do palpite:

1.  **Gatilho**: Um novo jogo do Brasileirão é listado como "próximo jogo" na API.
2.  **Coleta de Dados**: O sistema busca automaticamente as informações necessárias da Football-Data.org.
3.  **Busca de Tendências**: Uma rotina de busca na web (ou integração com APIs de odds, se disponível e sem custo) é acionada para coletar odds e notícias relevantes. Para a fase inicial, podemos simular essas tendências com base em dados históricos ou heurísticas.
4.  **Geração do Palpite**: Os dados coletados são formatados e enviados ao LLM, que retorna o palpite estruturado.
5.  **Armazenamento e Exibição**: O palpite é salvo no banco de dados (se aplicável) e exibido no card "Palpites do Mestre" na página inicial do WebApp.

## 7. Próximos Passos

Após a validação desta estrutura, os próximos passos incluirão:

*   Implementação da lógica de coleta de dados e formatação.
*   Desenvolvimento da integração com o LLM para geração dos palpites.
*   Criação da interface de usuário para exibir os palpites no card "Palpites do Mestre".

## Referências

[1] Trivela. *Como preparamos nossos palpites de apostas em futebol*. Disponível em: <https://trivela.com.br/apostas/palpites-de-futebol/como-preparamos-nossos-palpites-de-apostas/>.
[2] Lance. *Apostas Brasileirão 2026: top 10 melhores sites e dicas*. Disponível em: <https://www.lance.com.br/sites-de-apostas/apostas-brasileirao.html>.
[3] Finance Football. *Todo o processo de análise para apostas esportivas*. Disponível em: <https://financefootball.com/pt/2024/11/28/todo-o-processo-de-analise-para-apostas-esportivas/>.
