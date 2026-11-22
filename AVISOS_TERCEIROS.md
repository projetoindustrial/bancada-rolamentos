# Avisos de terceiros

O BEARING AI LAB é "todos os direitos reservados" (ver `LICENSE`), **exceto** os componentes de terceiros abaixo, que mantêm as licenças originais. Este arquivo só informa; o que vale é o texto de cada licença.

## Embutidos no site (`05_simulador_pwa/vendor/`)
| Componente | Licença | Autoria | Arquivo da licença |
|---|---|---|---|
| three.js | MIT | © 2010-2023 three.js authors | `vendor/three.LICENSE.txt` |
| jsPDF 2.5.2 | MIT | © 2010-2021 James Hall; © 2015-2021 yWorks GmbH | `vendor/jspdf.LICENSE.txt` |
| qrcode-generator 1.4.4 | MIT | © 2009 Kazuhiko Arase | `vendor/qrcode.LICENSE.txt` |

"QR Code" é marca registrada da DENSO WAVE INCORPORATED. Os três arquivos de licença acompanham as bibliotecas e **devem ser mantidos** em qualquer cópia do site.

## Usados, mas NÃO distribuídos neste pacote
- **Python (código de referência):** numpy, scipy, scikit-learn, joblib (BSD), plotly (MIT), streamlit (Apache-2.0). Instalados por `04_implementacao_python/requirements.txt`; cada um tem a própria licença.
- **Testes e CI:** jsdom (MIT), Node.js, GitHub Actions (`actions/checkout`, `setup-python`, `setup-node`). Só em desenvolvimento; o site publicado não depende deles.

## Dados e referências
O pacote **não inclui nem redistribui** nenhum conjunto de dados externo (CWRU, IMS, MFPT, Paderborn, MAFAULDA, FEMTO, KAIST etc.). As bases são citadas como referência e cada uma tem os seus termos de uso e a sua citação recomendada; baixe-as nas páginas oficiais e confira a licença antes de usar (por exemplo, o Paderborn é CC BY-NC 4.0, uso não comercial). Os dados do projeto são **sintéticos**, gerados pelo simulador. Detalhes e datas de acesso: `04_implementacao_python/referencias/`.
