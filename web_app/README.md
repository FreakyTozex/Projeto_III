# Painel de controlo de caixa ATM

Projeto académico de um sistema de gestão de acessos a uma caixa tipo ATM. Um microcontrolador ESP32 instalado na caixa controla quem a abre (cartão RFID e PIN) e deteta se foi depositado ou levantado dinheiro. Um servidor recebe estes dados e apresenta-os num dashboard web em tempo real.

## Funcionalidades

- **Controlo de acesso** por cartão RFID e PIN, com bloqueio após tentativas falhadas.
- **Registo de depósitos e levantamentos**, com estimativa do número de notas.
- **Alertas de violação** quando é detetado um impacto na estrutura da caixa.
- **Estado da caixa em direto:** ligada ou desligada, gaveta aberta ou fechada.
- **Dashboard em tempo real:** lista de atividade, gráfico diário de notas depositadas e levantadas.
- **Gestão de cartões autorizados**, guardados apenas sob a forma de hash.
- **Comandos remotos** para bloquear e desbloquear a caixa.
- **Registo de auditoria:** os eventos são só inseridos, nunca alterados nem apagados.

## Como funciona

```
ESP32 (caixa)  ──►  Servidor  ──►  Dashboard (browser)
 sensores e          validação        visualização
 controlo de         e registo        em tempo real
 acesso              dos eventos
```

1. O utilizador aproxima o cartão e introduz o PIN no teclado.
2. Se as credenciais forem válidas, a gaveta é libertada. O ESP32 mede o peso antes e depois da abertura.
3. A diferença de peso indica se houve **depósito** (aumento) ou **levantamento** (diminuição), e permite estimar o número de notas.
4. O ESP32 envia ao servidor o resultado do acesso e da transação.
5. O servidor valida os dados, guarda-os na base de dados e envia-os de imediato para o dashboard.
6. Se a ligação falhar, o dispositivo deve guardar os eventos e reenviá-los quando a rede voltar. Cada evento tem um identificador único, e o servidor ignora duplicados.

## Hardware

| Função | Componente |
|---|---|
| Microcontrolador | ESP32 DevKit |
| Leitor RFID | MFRC522 |
| Introdução de PIN | Teclado matricial |
| Estado da gaveta | Reed switch e íman |
| Depósito vs. levantamento | Célula de carga com HX711 |
| Violação (tamper) | Sensor piezoelétrico |
| Feedback | LEDs, buzzer e ecrã OLED |

O sensor piezoelétrico não é fiável para detetar notas, porque uma nota quase não gera vibração. Por isso é usado só como sensor de violação, e a distinção entre depósito e levantamento fica a cargo da célula de carga.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Dispositivo | ESP32 (Arduino ou PlatformIO) |
| Comunicação | MQTT |
| Back-end | Python, FastAPI, SQLAlchemy (async) |
| Base de dados | PostgreSQL |
| Front-end | React, TypeScript, Vite, TanStack Query, Recharts |
| Execução | Docker e Docker Compose |

## Estrutura do repositório

```
.
├── docker-compose.yml     Definição dos serviços
├── Dockerfile             Imagens do back-end e do front-end
├── .env.example           Modelo das variáveis de ambiente
├── backend/
│   ├── app/
│   │   ├── main.py        Arranque da aplicação e WebSocket
│   │   ├── mqtt.py        Receção e tratamento dos eventos do dispositivo
│   │   ├── routes.py      API REST
│   │   ├── models.py      Tabelas da base de dados
│   │   ├── schemas.py     Validação dos dados
│   │   ├── ws.py          Envio de eventos para o browser
│   │   ├── config.py      Configuração
│   │   └── db.py          Ligação à base de dados
│   └── scripts/
│       └── simulate.py    Simulador do dispositivo, para testar sem hardware
├── frontend/
│   └── src/
│       ├── App.tsx        Estrutura principal
│       ├── api.ts         Pedidos à API
│       ├── useLive.ts     Ligação em tempo real
│       └── components/    Painel de caixas, atividade, gráfico e cartões
└── nginx/                 Configuração do servidor web
```

## Como executar

Requisitos: Docker e Docker Compose.

```bash
cp .env.example .env        # define as credenciais no ficheiro .env
docker compose up -d --build
```

Para testar sem hardware, ativa o simulador do dispositivo:

```bash
docker compose --profile sim up -d simulator
```

Para ver os registos do back-end:

```bash
docker compose logs -f backend
```

## Segurança

- As credenciais e configurações sensíveis ficam no ficheiro `.env`, que **não deve ser versionado**.
- Os UIDs dos cartões RFID são guardados como hash e nunca em claro.
- Os PINs nunca são enviados em claro.
- O registo de eventos funciona como auditoria, só com inserções.

## Estado do projeto

**Implementado:** back-end, dashboard, execução em contentores e simulador.

**Em desenvolvimento:**

- Firmware do ESP32
- Autenticação e papéis de utilizador no dashboard
- Reforço da segurança da comunicação com o dispositivo
- Migrações da base de dados
