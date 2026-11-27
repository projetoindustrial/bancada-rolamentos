# Bancada de Rolamentos

Simulador didático de rolamentos que roda no navegador, sem servidor e sem login. Faz parte do projeto BEARING AI LAB (Projeto Integrador / TCC).

**Abrir:** https://projetoindustrial.github.io/bancada-rolamentos/ (funciona offline depois da primeira visita e pode ser instalado na tela inicial do celular).

## O que tem
- **Bancada em 3D** (com plano B em 2D): rolamento meio submerso em reservatório de vidro com nível de óleo, ou em carcaça com visor de graxa; visão térmica opcional; envelhecimento do óleo.
- **Som estilizado, vibração, espectro de envelope e espectrograma**, com as frequências de falha marcadas (1x, FTF, BPFO, BPFI, 2xBSF).
- **Diagnóstico por regras** com evidência, fonte e a frequência que mais pesou; película de óleo com espessura ilustrativa.
- **Controlador virtual** nos modos diagnóstico, assistido e automático, e **corrida A/B/C** entre operador sozinho, assistente com aprovação e automático.
- **Auditoria com hash encadeado** (SHA-256), com botão para adulterar uma linha, e testes de barreiras de segurança.
- **Linha do tempo** (pausar, voltar, play), **comparação de cenários**, histórico com exportação CSV e JSON, **relatório em PDF**, link para compartilhar o cenário.
- **Quiz** com níveis, tutorial guiado e modo daltônico.
- **Leitor de sinal real** (.wav, .csv/.txt e .mat v5) para ver o sinal ao lado do sintético. É só visual: não é laudo e o diagnóstico não é aplicado ao sinal real.
- **Modo apresentador** (roteiro de 15 minutos, tela cheia quando o navegador permite) e QR do endereço.

## Aviso
Os sinais são **sintéticos**, o som é **estilizado**, a visão térmica e a película de óleo são **ilustrativas** e os parâmetros são didáticos, não calibrados. A graxa é uma analogia visual do mesmo nível de lubrificação, não um modelo de graxa. Operador e aprovador simulados são modelos, não pessoas. Isto é uma demonstração e uma ferramenta de ensino: não é evidência de desempenho em máquina real e não deve ser usado para decisões reais de manutenção.

## Rodar no seu computador
Na pasta do repositório: `python3 -m http.server 8000` e abrir `http://localhost:8000`. Abrir o `index.html` direto do disco não ativa o modo offline.

## Este repositório
Contém somente o site publicado. O código-fonte de apoio, os testes, a documentação e o simulador em Python ficam no pacote do projeto, fora deste repositório.

## Créditos e licenças de terceiros
Os arquivos em `vendor/` têm a licença de cada projeto ao lado:
- [three.js](https://threejs.org), licença MIT.
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) 1.4.4, licença MIT. "QR Code" é marca registrada da DENSO WAVE INCORPORATED.
- [jsPDF](https://github.com/parallax/jsPDF) 2.5.2, licença MIT.

## Licença
Copyright (c) 2026 projetoindustrial. **Todos os direitos reservados** (ver [LICENSE](LICENSE)): é permitido visualizar e usar o site para fins pessoais, educacionais e de avaliação, além do que os Termos de Serviço do GitHub permitem a outros usuários da plataforma; qualquer outro uso exige autorização por escrito. Os componentes de terceiros mantêm as próprias licenças ([AVISOS_TERCEIROS.md](AVISOS_TERCEIROS.md)). Esta condição vale só para o BEARING AI LAB (trabalho de conclusão de curso, ver [LICENSE](LICENSE)); não se estende aos demais blocos do portal, que seguem o que cada um declara.
