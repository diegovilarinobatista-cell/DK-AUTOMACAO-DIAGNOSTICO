/**
 * diagnosticTaskEngine.ts
 * Motor de IA e Regras Heurísticas Industriais para Geração Dinâmica de Tarefas de Diagnóstico.
 * Adapta os procedimentos técnicos, checagens de campo, hipóteses e ações recomendadas
 * com base no equipamento, código de erro e sintoma real fornecido pelo operador.
 */

export interface GuidedTask {
  id: string;
  title: string;
  description: string;
  method: string;
  expected: string;
  result: 'ok' | 'failed' | 'untested';
}

export interface GeneratedDiagnosticPlan {
  category: 'sensor' | 'motor_drive' | 'pneumatic_hydraulic' | 'network_plc' | 'mechanical' | 'temperature' | 'general';
  categoryLabel: string;
  probableCause: string;
  rootCauseHypothesis: string;
  recommendedAction: string;
  tasks: GuidedTask[];
  actionPlan: Array<{
    type: 'Imediata' | 'Corretiva' | 'Preventiva';
    action: string;
    responsible: string;
    deadline: string;
  }>;
}

export function generateDiagnosticPlan(
  machineName: string,
  errorCode: string,
  symptom: string
): GeneratedDiagnosticPlan {
  const cleanMachine = machineName.trim() || 'Equipamento em Diagnóstico';
  const cleanCode = errorCode.trim() || 'F-GERAL';
  const cleanSymptom = symptom.trim() || 'Parada inesperada durante o ciclo de produção';
  const text = `${cleanMachine} ${cleanCode} ${cleanSymptom}`.toLowerCase();

  // 1. Sensores, Fins de Curso, Células de Carga, Posição, Recuo, Avanço, Encoders
  if (
    text.includes('sensor') ||
    text.includes('recuo') ||
    text.includes('avanço') ||
    text.includes('avanco') ||
    text.includes('fim de curso') ||
    text.includes('posiç') ||
    text.includes('posic') ||
    text.includes('indutivo') ||
    text.includes('óptic') ||
    text.includes('optic') ||
    text.includes('proximidade') ||
    text.includes('encoder') ||
    text.includes('leitura') ||
    text.includes('pressostato') ||
    text.includes('chave fim') ||
    text.includes('reed')
  ) {
    const isRecuo = text.includes('recuo');
    const isAvanco = text.includes('avanço') || text.includes('avanco');
    const sensorTarget = isRecuo
      ? 'sensor de recuo'
      : isAvanco
      ? 'sensor de avanço'
      : 'sensor de posição / fim de curso';

    return {
      category: 'sensor',
      categoryLabel: 'Instrumentação & Sensores de Posição',
      probableCause: `Falha no sinal de feedback do ${sensorTarget} em ${cleanMachine}: "${cleanSymptom}"`,
      rootCauseHypothesis: `Ausência de comutação lógica no ${sensorTarget} associado ao código [${cleanCode}]. Evidência observada em campo: "${cleanSymptom}". Provável perda de alimentação (24Vcc), cabo fadigado na esteira móvel ou oxidação do conector M12.`,
      recommendedAction: `Ajustar entreferro físico do ${sensorTarget} (1 a 4 mm), inspecionar cabo até o cartão de I/O e substituir o sensor caso não alterne o sinal.`,
      tasks: [
        {
          id: 'step-1',
          title: `Passo 1: Verificação Elétrica do ${sensorTarget} para "${cleanSymptom.slice(0, 45)}..."`,
          description: `Medir tensão de alimentação (24Vcc ± 10%) nos bornes do ${sensorTarget} em ${cleanMachine} referente à ocorrência: "${cleanSymptom}". Checar se o LED comuta fisicamente ao atuar o came metálico.`,
          method: `Multímetro digital nos terminais 1 (+) e 3 (-) do ${sensorTarget}`,
          expected: `Alimentação de 24Vcc estável e sinal de saída comutando entre 0V e 24V sem falhas intermitentes`,
          result: 'ok',
        },
        {
          id: 'step-2',
          title: `Passo 2: Alinhamento Mecânico e Entreferro (Gap) para [${cleanCode}]`,
          description: `Inspecionar fixação mecânica, folga entre face sensora e came e integridade do conector M12 em ${cleanMachine} devido a: "${cleanSymptom}".`,
          method: 'Calibre de folga centesimal e inspeção visual contra contaminação por óleo solúvel ou cavacos',
          expected: 'Sensor perfeitamente centralizado em relação ao batente com entreferro constante (1 a 3 mm)',
          result: 'failed',
        },
        {
          id: 'step-3',
          title: `Passo 3: Validação do Bit de I/O no CLP para "${cleanSymptom.slice(0, 45)}..."`,
          description: `Conferir se o sinal do ${sensorTarget} chega à entrada digital do CLP sem perda de pacote, confirmando a resolução da ocorrência "${cleanSymptom}".`,
          method: 'Monitoramento online da tabela de variáveis (I/O) no software de engenharia ou tela da IHM',
          expected: 'Bit de entrada digital ativando para nível lógico "1" quando o atuador alcança a posição',
          result: 'untested',
        },
      ],
      actionPlan: [
        {
          type: 'Imediata',
          action: `Realizar alinhamento mecânico do ${sensorTarget} e limpeza da face sensora e conectores referente a "${cleanSymptom}".`,
          responsible: 'Técnico de Manutenção Mecatrônica',
          deadline: 'Imediato (30 min)',
        },
        {
          type: 'Corretiva',
          action: `Substituir conector ou cabo se houver intermitência durante o movimento do eixo em ${cleanMachine}.`,
          responsible: 'Equipe de Manutenção Elétrica',
          deadline: 'Hoje (antes do retorno)',
        },
        {
          type: 'Preventiva',
          action: `Incluir inspeção periódica de fixação e entreferro dos sensores de fim de curso no plano TPM.`,
          responsible: 'Engenharia de Confiabilidade',
          deadline: 'Próxima Preditiva (15 dias)',
        },
      ],
    };
  }

  // 2. Motores, Inversores, Drives, Sobretensão, Chopper, Curto, Sobrecarga
  if (
    text.includes('motor') ||
    text.includes('inversor') ||
    text.includes('drive') ||
    text.includes('frenagem') ||
    text.includes('chopper') ||
    text.includes('sobretensão') ||
    text.includes('sobretensao') ||
    text.includes('sobrecorrente') ||
    text.includes('dc-bus') ||
    text.includes('barramento') ||
    text.includes('igbt') ||
    text.includes('f30002') ||
    text.includes('trip') ||
    text.includes('resistor')
  ) {
    return {
      category: 'motor_drive',
      categoryLabel: 'Acionamentos & Potência (Drive / Motor)',
      probableCause: `Sobretensão no barramento CC ou sobrecarga motora em ${cleanMachine}: "${cleanSymptom}"`,
      rootCauseHypothesis: `Pico regenerativo durante desaceleração brusca em ${cleanMachine} com código [${cleanCode}]. Sintoma reportado: "${cleanSymptom}". Resistor de frenagem aberto ou circuito chopper impediu dissipação térmica.`,
      recommendedAction: `Testar continuidade e valor ôhmico do resistor dinâmico, checar semicondutor IGBT e reajustar rampas de desaceleração (P1121).`,
      tasks: [
        {
          id: 'step-1',
          title: `Passo 1: Tensão Trifásica e Barramento CC para "${cleanSymptom.slice(0, 45)}..."`,
          description: `Medir tensões trifásicas de entrada R-S-T (380V ± 5%) e nível do barramento DC no drive de ${cleanMachine} após a parada: "${cleanSymptom}".`,
          method: 'Multímetro True-RMS CAT III 600V nos bornes R-S, S-T, T-R e nos terminais DC+/DC-',
          expected: '380V simétrico entre fases de rede e 540V CC estável no barramento intermediário',
          result: 'ok',
        },
        {
          id: 'step-2',
          title: `Passo 2: Teste de Resistência do Chopper / Resistor para [${cleanCode}]`,
          description: `Desconectar resistor dinâmico e medir resistência ôhmica conforme tolerância de placa, investigando o sintoma: "${cleanSymptom}".`,
          method: 'Medição ôhmica a 20°C e teste de diodo/junção nos terminais do chopper IGBT',
          expected: 'Resistência ôhmica nominal (± 5%) sem circuito aberto, queima ou fuga para a carcaça',
          result: 'failed',
        },
        {
          id: 'step-3',
          title: `Passo 3: Resistência e Isolação das Fases do Motor de ${cleanMachine}`,
          description: `Medir equilíbrio ôhmico entre fases U-V-W do motor de ${cleanMachine} e teste de isolação (Megôhmetro a 500Vcc) para descartar fuga interna relacionada a "${cleanSymptom}".`,
          method: 'Ponte miliôhmica de precisão e Megôhmetro digital calibrado aplicado à carcaça',
          expected: 'Resistências equilibradas entre fases (< 2% desvio) e isolação para carcaça > 20 MΩ',
          result: 'untested',
        },
      ],
      actionPlan: [
        {
          type: 'Imediata',
          action: `Substituir componente com defeito identificado durante teste do sintoma "${cleanSymptom}".`,
          responsible: 'Técnico Especialista de Automação',
          deadline: 'Imediato (1 hora)',
        },
        {
          type: 'Corretiva',
          action: `Ajustar parâmetros de rampa de desaceleração (P1121) no conversor de ${cleanMachine}.`,
          responsible: 'Engenheiro de Aplicação',
          deadline: 'Antes do retorno',
        },
        {
          type: 'Preventiva',
          action: 'Cadastrar inspeção termográfica periódica no barramento CC e chopper.',
          responsible: 'Supervisão de Manutenção',
          deadline: 'Próxima Preditiva (15 dias)',
        },
      ],
    };
  }

  // 3. Pneumática, Hidráulica, Pressão, Vazamento, Cilindro, Válvula
  if (
    text.includes('pneumat') ||
    text.includes('pneumát') ||
    text.includes('hidraul') ||
    text.includes('hidrául') ||
    text.includes('pressão') ||
    text.includes('pressao') ||
    text.includes('vazamento') ||
    text.includes('cilindro') ||
    text.includes('válvula') ||
    text.includes('valvula') ||
    text.includes('solenoide') ||
    text.includes('pistão') ||
    text.includes('pistao') ||
    text.includes('óleo') ||
    text.includes('oleo') ||
    text.includes('ar comprimido')
  ) {
    return {
      category: 'pneumatic_hydraulic',
      categoryLabel: 'Pneumática & Hidráulica',
      probableCause: `Anomalia de pressão fluídica ou vedação em ${cleanMachine}: "${cleanSymptom}"`,
      rootCauseHypothesis: `Queda dinâmica de pressão no circuito durante o acionamento em ${cleanMachine} com código [${cleanCode}]. Sintoma reportado: "${cleanSymptom}". Provável escape nas vedações ou bobina da válvula desenergizada.`,
      recommendedAction: `Testar pressão manométrica de linha, acionar piloto manual da eletroválvula e substituir mangueiras/vedações com fuga.`,
      tasks: [
        {
          id: 'step-1',
          title: `Passo 1: Verificação Manométrica de Linha para "${cleanSymptom.slice(0, 45)}..."`,
          description: `Medir pressão estática e dinâmica na entrada do conjunto FRL / bloco hidráulico de ${cleanMachine} durante a ocorrência: "${cleanSymptom}".`,
          method: 'Manômetro de precisão instalado na tomada de serviço do bloco de distribuição',
          expected: 'Pressão constante entre 6.0 e 7.5 bar (pneumática) ou 90 e 120 bar (hidráulica) sem oscilação',
          result: 'ok',
        },
        {
          id: 'step-2',
          title: `Passo 2: Teste de Comando da Válvula Solenoide para [${cleanCode}]`,
          description: `Verificar tensão de 24Vcc na bobina da eletroválvula e testar acionamento manual piloto para solucionar o sintoma: "${cleanSymptom}".`,
          method: 'Multímetro nos terminais da bobina DIN e teste mecânico manual com pino piloto',
          expected: '24Vcc presente sob comando e carretel comutando com fluxo livre sem travamento',
          result: 'failed',
        },
        {
          id: 'step-3',
          title: `Passo 3: Teste de Estanqueidade e Vedações Internas em ${cleanMachine}`,
          description: `Inspecionar conexões, mangueiras e teste de fuga no êmbolo do cilindro relacionado à ocorrência "${cleanSymptom}".`,
          method: 'Detector ultrassônico ou líquido reagente de microvazamento em conexões pressurizadas',
          expected: 'Zero vazamento audível ou visual e sustentação de carga na câmara do atuador',
          result: 'untested',
        },
      ],
      actionPlan: [
        {
          type: 'Imediata',
          action: `Limpar ou substituir a bobina/vedação com falha associada a "${cleanSymptom}".`,
          responsible: 'Mecânico de Manutenção de Linha',
          deadline: 'Imediato (45 min)',
        },
        {
          type: 'Corretiva',
          action: `Trocar vedações desgastadas e reapertar conexões pneumáticas em ${cleanMachine}.`,
          responsible: 'Equipe de Fluídos e Hidráulica',
          deadline: 'Hoje',
        },
        {
          type: 'Preventiva',
          action: 'Verificar dreno automático e saturação do filtro coalescente do conjunto FRL.',
          responsible: 'Técnico de Confiabilidade',
          deadline: 'Em 7 dias',
        },
      ],
    };
  }

  // 4. Rede Industrial, Comunicação, Profinet, Ethernet, CLP, IHM
  if (
    text.includes('rede') ||
    text.includes('profinet') ||
    text.includes('ethernet') ||
    text.includes('ethercat') ||
    text.includes('modbus') ||
    text.includes('comunicaç') ||
    text.includes('comunicac') ||
    text.includes('switch') ||
    text.includes('perda de sinal') ||
    text.includes('clp') ||
    text.includes('plc') ||
    text.includes('offline') ||
    text.includes('ihm') ||
    text.includes('display')
  ) {
    return {
      category: 'network_plc',
      categoryLabel: 'Redes Industriais & Automação (CLP / IHM)',
      probableCause: `Perda de comunicação na rede industrial de ${cleanMachine}: "${cleanSymptom}"`,
      rootCauseHypothesis: `Interrupção do ciclo de polling Profinet/EtherNet na CPU ou remota de ${cleanMachine} com código [${cleanCode}]. Sintoma reportado: "${cleanSymptom}". Provável cabo danificado ou ruído eletromagnético.`,
      recommendedAction: `Testar integridade da malha de aterramento do cabo blindado, verificar LEDs de diagnóstico e substituir conector RJ45/M12 com mau contato.`,
      tasks: [
        {
          id: 'step-1',
          title: `Passo 1: Inspeção de LEDs de Link/Activity para "${cleanSymptom.slice(0, 45)}..."`,
          description: `Verificar status dos LEDs Link (verde) e RX/TX (laranja) no módulo de rede de ${cleanMachine} diante do sintoma: "${cleanSymptom}".`,
          method: 'Inspeção direta nos módulos de comunicação e verificação de encaixe dos conectores M12/RJ45',
          expected: 'LEDs de Link permanentemente acesos sem cintilação de erro vermelho/vermelho piscante',
          result: 'ok',
        },
        {
          id: 'step-2',
          title: `Passo 2: Continuidade e Blindagem do Cabo Industrial para [${cleanCode}]`,
          description: `Testar continuidade dos pares do cabo de rede e medir resistência de aterramento da malha referente ao sintoma: "${cleanSymptom}".`,
          method: 'Certificador/testador de cabos CAT 5e/CAT 6 e multímetro para medição da continuidade do shield',
          expected: 'Resistência de blindagem < 1.0 Ω e zero pares abertos ou invertidos',
          result: 'failed',
        },
        {
          id: 'step-3',
          title: `Passo 3: Acesso ao Buffer de Diagnóstico da CPU em ${cleanMachine}`,
          description: `Acessar o histórico de falhas e eventos do CLP para identificar o nó causador da ocorrência "${cleanSymptom}".`,
          method: 'Software de engenharia conectado via PG/PC à CPU',
          expected: 'Identificação exata do nó desconectado e tempo de ciclo < 4ms restaurado',
          result: 'untested',
        },
      ],
      actionPlan: [
        {
          type: 'Imediata',
          action: `Refazer conector industrial M12 ou trocar patch cord blindado de ${cleanMachine}.`,
          responsible: 'Técnico de Automação',
          deadline: 'Imediato (40 min)',
        },
        {
          type: 'Corretiva',
          action: 'Reorganizar rota do cabo para longe de cabos de potência dos inversores.',
          responsible: 'Eletricista Industrial',
          deadline: 'Antes do retorno',
        },
        {
          type: 'Preventiva',
          action: 'Realizar auditoria de qualidade de rede industrial e tráfego de broadcast com analisador.',
          responsible: 'Engenharia de Automação',
          deadline: 'Mensal',
        },
      ],
    };
  }

  // 5. Mecânica, Rolamento, Ruído, Vibração, Eixo, Travamento, Fuso
  if (
    text.includes('ruído') ||
    text.includes('ruido') ||
    text.includes('vibra') ||
    text.includes('mecânic') ||
    text.includes('mecanic') ||
    text.includes('rolamento') ||
    text.includes('travad') ||
    text.includes('engrenagem') ||
    text.includes('fuso') ||
    text.includes('guia') ||
    text.includes('folga') ||
    text.includes('aquecimento')
  ) {
    return {
      category: 'mechanical',
      categoryLabel: 'Mecânica & Cinemática dos Eixos',
      probableCause: `Desgaste mecânico, folga ou atrito anormal em ${cleanMachine}: "${cleanSymptom}"`,
      rootCauseHypothesis: `Resistência mecânica anormal no deslocamento do eixo de ${cleanMachine} com código [${cleanCode}]. Sintoma reportado: "${cleanSymptom}". Contaminação de graxa ou desalinhamento provocou sobretorque.`,
      recommendedAction: `Inspecionar guias lineares, medir folga axial com relógio comparador e verificar sistema de dosagem de lubrificação.`,
      tasks: [
        {
          id: 'step-1',
          title: `Passo 1: Inspeção Termográfica e Auscultação para "${cleanSymptom.slice(0, 45)}..."`,
          description: `Medir temperatura operacional nos mancais e mancais de rolamentos em ${cleanMachine} devido à ocorrência: "${cleanSymptom}".`,
          method: 'Pirômetro óptico / câmera termográfica e estetoscópio mecânico industrial',
          expected: 'Temperatura inferior a 65°C e ruído rotativo contínuo sem estalos ou chiado metálico',
          result: 'ok',
        },
        {
          id: 'step-2',
          title: `Passo 2: Folga Axial/Radial e Alinhamento para [${cleanCode}]`,
          description: `Posicionar relógio comparador centesimal para medir folga de reversão (backlash) e paralelismo de guias para o sintoma: "${cleanSymptom}".`,
          method: 'Relógio comparador centesimal com base magnética nos pontos de apoio do eixo',
          expected: 'Folga dentro da tolerância do fabricante (< 0.02 mm para eixos de precisão)',
          result: 'failed',
        },
        {
          id: 'step-3',
          title: `Passo 3: Movimentação Manual sem Carga e Lubrificação em ${cleanMachine}`,
          description: `Desacoplar o motor e girar o eixo manualmente para detectar pontos duros ou falta de lubrificação relacionada a "${cleanSymptom}".`,
          method: 'Giro manual do eixo com freio mecânico aliviado e verificação visual do filme de graxa',
          expected: 'Movimento suave, filme uniforme de graxa limpa e zero travamentos mecânicos',
          result: 'untested',
        },
      ],
      actionPlan: [
        {
          type: 'Imediata',
          action: `Limpar barramentos, purgar dosadores de lubrificação e aplicar graxa referente a "${cleanSymptom}".`,
          responsible: 'Mecânico de Manutenção',
          deadline: 'Imediato (1 hora)',
        },
        {
          type: 'Corretiva',
          action: 'Ajustar pré-carga das porcas do fuso e réguas de guia se houver folga residual.',
          responsible: 'Especialista Mecânico',
          deadline: 'Hoje',
        },
        {
          type: 'Preventiva',
          action: 'Inserir coleta de análise de vibração espectral quinzenal na rota de preditiva.',
          responsible: 'Analista de Preditiva',
          deadline: '15 dias',
        },
      ],
    };
  }

  // 6. Caso Geral Adaptado Dinamicamente ao Equipamento e Sintoma
  return {
    category: 'general',
    categoryLabel: 'Diagnóstico Técnico Estruturado Multidisciplinar',
    probableCause: `Anomalia operacional em ${cleanMachine}: "${cleanSymptom}"`,
    rootCauseHypothesis: `Comportamento irregular detectado em ${cleanMachine} sob código [${cleanCode}]. Evidências apontam diretamente para: "${cleanSymptom}".`,
    recommendedAction: `Seguir os passos técnicos de isolamento de campo para confirmar causas eletromecânicas e restabelecer a operação segura em ${cleanMachine}.`,
    tasks: [
      {
        id: 'step-1',
        title: `Passo 1: Verificação Elétrica e Alimentação para "${cleanSymptom.slice(0, 45)}..."`,
        description: `Medir tensões de alimentação trifásica e fontes auxiliares de comando (24Vcc / 110Vca) em ${cleanMachine}, verificando disjuntores e fusíveis associados à ocorrência: "${cleanSymptom}".`,
        method: 'Multímetro True-RMS medindo tensões de entrada e saída nos bornes principais',
        expected: 'Tensões estabilizadas dentro da tolerância nominal de ± 5% sem queima de fusíveis',
        result: 'ok',
      },
      {
        id: 'step-2',
        title: `Passo 2: Inspeção do Subsistema Envolvido no Sintoma [${cleanCode}]`,
        description: `Inspecionar fisicamente o subsistema de ${cleanMachine} relacionado ao sintoma "${cleanSymptom}", checando fixação, sinais de desgaste, temperatura anômala e integridade de fiação.`,
        method: 'Inspeção eletromecânica detalhada e teste funcional do atuador/sensor',
        expected: 'Componente íntegro, sem oxidação, sem aquecimento excessivo e com cabos bem crimpados',
        result: 'failed',
      },
      {
        id: 'step-3',
        title: `Passo 3: Validação de Intertravamento e Retorno Seguro em ${cleanMachine}`,
        description: `Testar circuito de emergência, relés de segurança (NR-12) e validação da rotina de rearme diante do sintoma "${cleanSymptom}" para certificar que o ciclo pode ser retomado sem novos alarmes.`,
        method: 'Teste funcional passo a passo em modo manual e reset de falha na IHM',
        expected: 'Circuito de segurança desarmado sem travamento e permissão de ciclo confirmada',
        result: 'untested',
      },
    ],
    actionPlan: [
      {
        type: 'Imediata',
        action: `Corrigir anomalia pontual identificada em ${cleanMachine} referente a "${cleanSymptom}".`,
        responsible: 'Técnico Especialista de Campo',
        deadline: 'Imediato (1 hora)',
      },
      {
        type: 'Corretiva',
        action: `Validar ciclo completo em vazio e em carga antes da liberação formal para produção.`,
        responsible: 'Operador Líder e Manutenção',
        deadline: 'Antes do retorno',
      },
      {
        type: 'Preventiva',
        action: `Cadastrar histórico de ocorrência para análise de falha RCA e Lição de Ponto Único (LPU).`,
        responsible: 'Supervisão de Confiabilidade',
        deadline: 'Em 7 dias',
      },
    ],
  };
}
