import type { HLJSApi, Language } from 'highlight.js';

// Gramática de PeopleCode (PeopleSoft) para highlight.js. No existe en el paquete oficial.
// Referencia de sintaxis: PeopleTools PeopleCode Language Reference.
export default function peoplecode(hljs: HLJSApi): Language {
  const KEYWORDS = [
    'If', 'Then', 'Else', 'End-If',
    'For', 'To', 'Step', 'End-For',
    'While', 'End-While',
    'Repeat', 'Until',
    'Evaluate', 'When', 'When-Other', 'End-Evaluate',
    'Break', 'Continue', 'Exit', 'Return',
    'Function', 'End-Function', 'Declare', 'PeopleCode', 'Library',
    'Local', 'Global', 'Component', 'Constant', 'Instance',
    'Import', 'Class', 'End-Class', 'Extends', 'Implements',
    'Method', 'End-Method', 'Property', 'Get', 'Set', 'End-Get', 'End-Set',
    'Private', 'Protected', 'Public', 'ReadOnly', 'Abstract',
    'Create', 'Try', 'Catch', 'End-Try', 'Throw',
    'And', 'Or', 'Not', 'As', 'Of', 'Ref', 'Out',
    'FieldDefault', 'FieldEdit', 'FieldChange', 'FieldFormula',
    'RowInit', 'RowInsert', 'RowDelete', 'RowSelect',
    'SaveEdit', 'SavePreChange', 'SavePostChange', 'SearchInit', 'SearchSave',
    'PrePopup', 'ItemSelected', 'Activate', 'Workflow'
  ];

  const TYPES = [
    'string', 'number', 'integer', 'float', 'boolean', 'date', 'time', 'datetime', 'any',
    'object', 'array', 'Record', 'Field', 'Rowset', 'Row', 'Grid', 'GridColumn', 'Page',
    'SQL', 'File', 'Message', 'XmlDoc', 'XmlNode', 'ApiObject', 'JavaObject', 'Exception',
    'Chart', 'Interlink', 'Session', 'ProcessRequest', 'Cookie', 'Request', 'Response'
  ];

  // Ninguna palabra puede estar en dos listas: con case_insensitive, 'string' (tipo) y
  // 'String' (función) son el mismo token. Se conserva el uso más frecuente en código real.
  const BUILT_INS = [
    'MessageBox', 'WinMessage', 'Error', 'Warning',
    'GetRecord', 'GetField', 'GetRowset', 'GetRow', 'GetLevel0', 'GetPage', 'GetGrid',
    'CreateRecord', 'CreateRowset', 'CreateSQL', 'CreateArray', 'CreateObject', 'CreateException',
    'SQLExec', 'Fetch', 'Execute', 'Select', 'Insert', 'Update', 'Delete', 'Close',
    'FetchValue', 'UpdateValue', 'SetDefault', 'SetCursorPos', 'Transfer', 'TransferPage',
    'DoModal', 'DoSave', 'DoSaveNow', 'DoCancel', 'SetSearchDialogBehavior',
    'Gray', 'Ungray', 'Hide', 'Unhide', 'SetLabel', 'SetStyle',
    'Len', 'Substring', 'Upper', 'Lower', 'LTrim', 'RTrim', 'Find', 'Replace', 'Split',
    'Value', 'Round', 'Truncate', 'Int', 'Abs', 'Mod', 'Sqrt',
    'DateValue', 'TimeValue', 'DateTime6', 'DateTimeValue', 'Days', 'Hour',
    'Minute', 'Second', 'Year', 'Month', 'Day', 'AddToDate', 'AddToTime', 'Weekday',
    'None', 'All', 'IsDate', 'IsNumber', 'IsTime', 'Exact', 'Exec', 'GetFile', 'GetEnv',
    'MsgGet', 'MsgGetText', 'MsgGetExplainText', 'RemoteCall', 'CallAppEngine', 'GetHTMLText',
    'GetSQL', 'GetJavaClass', 'ObjectGetProperty', 'ObjectSetProperty', 'ObjectDoMethod'
  ];

  // Prefijos de definiciones: Record.PERSONAL_DATA, Field.EMPLID, Page.MI_PAGINA, etc.
  const DEFINITION_REFERENCE = {
    scope: 'symbol',
    begin: /\b(?:Record|Field|Page|Component|MenuName|Scroll|Panel|SQL|HTML|Message|MessageSet|Style|Image|FileLayout|Menu|BarName|ItemName|CompIntfc|Node|Portal|Operation|Interlink|BusProcess|BusActivity|BusEvent|Activity|SetID|Metadata)\.[A-Za-z_][\w]*/
  };

  const STRING = {
    scope: 'string',
    begin: /"/,
    end: /"/,
    contains: [{ begin: /""/ }]
  };

  return {
    name: 'PeopleCode',
    aliases: ['pcode', 'peoplesoft'],
    case_insensitive: true,
    keywords: {
      // Permite guiones para que End-If, End-For, When-Other sean un solo token.
      $pattern: /[A-Za-z_][\w-]*/,
      keyword: KEYWORDS,
      type: TYPES,
      built_in: BUILT_INS,
      literal: ['True', 'False', 'Null']
    },
    contains: [
      hljs.C_BLOCK_COMMENT_MODE,
      { scope: 'comment', begin: /<\*/, end: /\*>/ },
      { scope: 'comment', begin: /\/\+/, end: /\+\// },
      { scope: 'comment', begin: /\bREM\b/, end: /;/ },
      STRING,
      { scope: 'variable', begin: /&[A-Za-z_][\w]*/ },
      { scope: 'variable.language', begin: /%[A-Za-z_][\w]*/ },
      DEFINITION_REFERENCE,
      {
        begin: [/\b(?:Function|Method|Class)\b/, /\s+/, /[A-Za-z_][\w]*/],
        beginScope: { 1: 'keyword', 3: 'title.function' }
      },
      hljs.C_NUMBER_MODE
    ]
  };
}
