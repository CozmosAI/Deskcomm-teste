---
impacto: nada_mudou
secao: corrigido
titulo: Testes de agentes sempre encerram a execução
---

O sandbox de agentes agora aplica um limite de 60 segundos à chamada do modelo e registra a execução como concluída ou falha antes de responder. Erros continuam seguros para o usuário, enquanto os logs recebem apenas códigos e identificadores de correlação, sem prompt, resposta, dados pessoais ou credenciais.
