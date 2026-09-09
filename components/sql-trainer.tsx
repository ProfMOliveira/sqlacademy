'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import initSqlJs from 'sql.js/dist/sql-asm.js';
import type { Database } from 'sql.js';
import {
  AlertCircle, Award, BookOpen, Check, CheckCircle2, ChevronRight, Code2,
  Database as DbIcon, Flame, GraduationCap, Lightbulb, Lock, Menu, Play,
  RotateCcw, Search, ShieldCheck, Star, Table2, Terminal, Trophy, X, Zap
} from 'lucide-react';

type Row = Record<string, unknown>;
type Level = 'Básico' | 'Intermediário' | 'Avançado';
type Lesson = { id:string; module:string; level:Level; title:string; desc:string; sql:string; tip:string; xp:number };
type Exercise = { id:string; level:Level; module:string; title:string; prompt:string; hint:string; explanation:string; expected:string; xp:number };

const lessons: Lesson[] = [
 {id:'create-table',module:'Fundamentos',level:'Básico',title:'CREATE TABLE',desc:'Crie tabelas e defina colunas.',sql:`CREATE TABLE cursos (\n  id INTEGER PRIMARY KEY,\n  nome TEXT NOT NULL,\n  carga_horaria INTEGER CHECK (carga_horaria > 0)\n);`,tip:'PRIMARY KEY identifica o registro. NOT NULL exige um valor. CHECK valida uma regra.',xp:40},
 {id:'insert',module:'Fundamentos',level:'Básico',title:'INSERT INTO',desc:'Insira uma ou várias linhas.',sql:`INSERT INTO alunos (id, nome, idade, curso)\nVALUES (6, 'Fabio', 23, 'SQL');`,tip:'Informe as colunas explicitamente para tornar o INSERT mais seguro e legível.',xp:40},
 {id:'select',module:'Consultas',level:'Básico',title:'SELECT',desc:'Consulte dados.',sql:`SELECT id, nome, curso\nFROM alunos;`,tip:'SELECT define as colunas retornadas. Use * quando quiser todas.',xp:40},
 {id:'where',module:'Consultas',level:'Básico',title:'WHERE',desc:'Filtre registros.',sql:`SELECT nome, idade\nFROM alunos\nWHERE idade >= 21;`,tip:'WHERE filtra linhas. Combine condições com AND, OR e NOT.',xp:50},
 {id:'order',module:'Consultas',level:'Básico',title:'ORDER BY',desc:'Ordene resultados.',sql:`SELECT nome, idade\nFROM alunos\nORDER BY idade DESC;`,tip:'ASC é crescente; DESC é decrescente.',xp:50},
 {id:'distinct',module:'Consultas',level:'Básico',title:'DISTINCT',desc:'Elimine duplicidades do resultado.',sql:`SELECT DISTINCT curso\nFROM alunos;`,tip:'DISTINCT considera a combinação das colunas selecionadas.',xp:50},
 {id:'aggregate',module:'Agregações',level:'Intermediário',title:'COUNT / SUM / AVG / MIN / MAX',desc:'Resuma conjuntos de dados.',sql:`SELECT COUNT(*) AS total, AVG(idade) AS media, MIN(idade) AS menor, MAX(idade) AS maior\nFROM alunos;`,tip:'Agregações transformam várias linhas em métricas.',xp:70},
 {id:'group',module:'Agregações',level:'Intermediário',title:'GROUP BY / HAVING',desc:'Agrupe e filtre grupos.',sql:`SELECT curso, COUNT(*) AS total\nFROM alunos\nGROUP BY curso\nHAVING COUNT(*) >= 1;`,tip:'WHERE filtra linhas antes do agrupamento; HAVING filtra grupos.',xp:80},
 {id:'join',module:'Relacionamentos',level:'Intermediário',title:'INNER JOIN',desc:'Combine tabelas relacionadas.',sql:`SELECT a.nome, m.disciplina, m.nota\nFROM alunos a\nINNER JOIN matriculas m ON m.aluno_id = a.id;`,tip:'INNER JOIN retorna somente registros com correspondência.',xp:80},
 {id:'left-join',module:'Relacionamentos',level:'Intermediário',title:'LEFT JOIN',desc:'Mantenha todos da tabela esquerda.',sql:`SELECT a.nome, m.disciplina\nFROM alunos a\nLEFT JOIN matriculas m ON m.aluno_id = a.id;`,tip:'LEFT JOIN preserva todos os registros da tabela à esquerda.',xp:80},
 {id:'update',module:'Manipulação',level:'Intermediário',title:'UPDATE',desc:'Altere registros.',sql:`UPDATE alunos\nSET curso = 'SQL Avançado'\nWHERE id = 1;`,tip:'Antes de UPDATE, teste o mesmo WHERE com SELECT.',xp:70},
 {id:'delete',module:'Manipulação',level:'Intermediário',title:'DELETE',desc:'Exclua registros.',sql:`DELETE FROM alunos\nWHERE id = 6;`,tip:'Sem WHERE, DELETE pode remover todas as linhas.',xp:70},
 {id:'constraints',module:'Estrutura',level:'Intermediário',title:'Constraints',desc:'Garanta integridade dos dados.',sql:`CREATE TABLE produtos (\n id INTEGER PRIMARY KEY,\n nome TEXT UNIQUE NOT NULL,\n preco REAL CHECK (preco >= 0),\n ativo INTEGER DEFAULT 1\n);`,tip:'Restrições fazem o banco rejeitar dados inválidos.',xp:90},
 {id:'subquery',module:'SQL Avançado',level:'Avançado',title:'Subqueries',desc:'Consulte usando outra consulta.',sql:`SELECT nome, idade\nFROM alunos\nWHERE idade > (SELECT AVG(idade) FROM alunos);`,tip:'Uma subconsulta pode fornecer valores para filtros, colunas ou tabelas derivadas.',xp:100},
 {id:'cte',module:'SQL Avançado',level:'Avançado',title:'CTE — WITH',desc:'Organize consultas complexas.',sql:`WITH maiores AS (\n SELECT * FROM alunos WHERE idade >= 21\n)\nSELECT nome, idade FROM maiores;`,tip:'WITH cria uma consulta nomeada temporária e melhora a legibilidade.',xp:100},
 {id:'window',module:'SQL Avançado',level:'Avançado',title:'Window Functions',desc:'Calcule sem perder o detalhe das linhas.',sql:`SELECT nome, idade,\n ROW_NUMBER() OVER (ORDER BY idade DESC) AS posicao\nFROM alunos;`,tip:'OVER define a janela usada pela função.',xp:120},
 {id:'view',module:'SQL Avançado',level:'Avançado',title:'VIEW',desc:'Crie consultas reutilizáveis.',sql:`CREATE VIEW alunos_maiores AS\nSELECT id, nome, idade FROM alunos WHERE idade >= 18;\nSELECT * FROM alunos_maiores;`,tip:'Uma VIEW encapsula uma consulta para reutilização.',xp:100},
 {id:'transaction',module:'Transações',level:'Avançado',title:'BEGIN / COMMIT / ROLLBACK',desc:'Controle alterações em transações.',sql:`BEGIN TRANSACTION;\nUPDATE alunos SET idade = idade + 1 WHERE id = 1;\nROLLBACK;`,tip:'ROLLBACK desfaz alterações da transação; COMMIT confirma.',xp:120},
];

const exercises: Exercise[] = [
 {id:'ex-select',level:'Básico',module:'Consultas',title:'Liste os alunos adultos',prompt:'Escreva uma consulta que retorne nome e idade dos alunos com idade maior ou igual a 18. O resultado deve ter pelo menos 5 linhas.',hint:'Use SELECT, FROM e WHERE.',explanation:'SELECT escolhe as colunas que serão exibidas; FROM indica a tabela consultada; WHERE filtra somente as linhas que atendem à condição.',expected:`SELECT nome, idade FROM alunos WHERE idade >= 18;`,xp:100},
 {id:'ex-order',level:'Básico',module:'Consultas',title:'Mais velhos primeiro',prompt:'Retorne nome e idade de todos os alunos, ordenando do mais velho para o mais novo.',hint:'Use ORDER BY idade DESC.',explanation:'ORDER BY organiza as linhas do resultado. DESC coloca os maiores valores primeiro; ASC faria a ordenação crescente.',expected:`SELECT nome, idade FROM alunos ORDER BY idade DESC;`,xp:120},
 {id:'ex-group',level:'Intermediário',module:'Agregações',title:'Conte alunos por curso',prompt:'Mostre cada curso e a quantidade de alunos matriculados nele. Use GROUP BY.',hint:'COUNT(*) + GROUP BY.',explanation:'COUNT(*) conta as linhas de cada grupo. GROUP BY reúne as linhas que possuem o mesmo curso antes de aplicar a contagem.',expected:`SELECT curso, COUNT(*) AS total FROM alunos GROUP BY curso;`,xp:180},
 {id:'ex-join',level:'Intermediário',module:'Relacionamentos',title:'Notas dos alunos',prompt:'Use INNER JOIN para mostrar o nome do aluno, a disciplina e a nota.',hint:'Relacione matriculas.aluno_id com alunos.id.',explanation:'INNER JOIN combina registros de duas tabelas quando a condição do ON é verdadeira. Aqui, aluno_id relaciona a matrícula ao id do aluno.',expected:`SELECT a.nome, m.disciplina, m.nota FROM alunos a INNER JOIN matriculas m ON m.aluno_id = a.id;`,xp:220},
 {id:'ex-subquery',level:'Avançado',module:'SQL Avançado',title:'Acima da média',prompt:'Mostre os alunos cuja idade é maior que a idade média de todos os alunos. Use uma subconsulta.',hint:'A média pode ser obtida com AVG(idade).',explanation:'Uma subconsulta entre parênteses pode calcular um valor antes da consulta principal. AVG(idade) produz a média usada pelo WHERE.',expected:`SELECT nome, idade FROM alunos WHERE idade > (SELECT AVG(idade) FROM alunos);`,xp:300},
 {id:'ex-window',level:'Avançado',module:'SQL Avançado',title:'Ranking por idade',prompt:'Crie uma coluna chamada posicao usando ROW_NUMBER() OVER (ORDER BY idade DESC).',hint:'Use ROW_NUMBER() OVER (ORDER BY idade DESC).',explanation:'ROW_NUMBER() atribui uma posição a cada linha. OVER define a janela e a ordenação usada para calcular essa posição, sem agrupar ou eliminar registros.',expected:`SELECT nome, idade, ROW_NUMBER() OVER (ORDER BY idade DESC) AS posicao FROM alunos;`,xp:350},
];

const seed=`CREATE TABLE alunos (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, idade INTEGER, curso TEXT);\nCREATE TABLE matriculas (id INTEGER PRIMARY KEY, aluno_id INTEGER, disciplina TEXT, nota REAL, FOREIGN KEY(aluno_id) REFERENCES alunos(id));\nINSERT INTO alunos VALUES (1,'Ana',20,'Banco de Dados'),(2,'Bruno',22,'Programação'),(3,'Carla',19,'Banco de Dados'),(4,'Diego',25,'Redes'),(5,'Elisa',21,'Programação');\nINSERT INTO matriculas VALUES (1,1,'SQL',9.2),(2,1,'Modelagem',8.8),(3,2,'SQL',7.5),(4,3,'SQL',9.8),(5,4,'Redes',8.1);`;

function normalizeSql(s:string){return s.toLowerCase().replace(/--.*$/gm,'').replace(/\/\*[^]*?\*\//g,'').replace(/\s+/g,' ').replace(/;+/g,';').trim();}
function levelIndex(l:Level){return l==='Básico'?0:l==='Intermediário'?1:2;}

export default function SqlTrainer(){
 const dbRef=useRef<Database|null>(null);
 const [ready,setReady]=useState(false); const [code,setCode]=useState(lessons[0].sql); const [active,setActive]=useState('create-table');
 const [rows,setRows]=useState<Row[]>([]); const [cols,setCols]=useState<string[]>([]); const [message,setMessage]=useState('Pronto para executar.'); const [error,setError]=useState(false);
 const [search,setSearch]=useState(''); const [mobile,setMobile]=useState(false); const [tab,setTab]=useState<'aulas'|'exercicios'|'desafios'>('aulas');
 const [level,setLevel]=useState<Level>('Básico'); const [userName,setUserName]=useState(''); const [nameDraft,setNameDraft]=useState(''); const [showNameModal,setShowNameModal]=useState(false); const [completedLessons,setCompletedLessons]=useState<string[]>([]); const [completedExercises,setCompletedExercises]=useState<string[]>([]); const [xp,setXp]=useState(0); const [streak,setStreak]=useState(1); const [showCertificate,setShowCertificate]=useState(false); const [showLessonHint,setShowLessonHint]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem('sql-trainer-progress');if(raw){const p=JSON.parse(raw);setCompletedLessons(p.lessons||[]);setCompletedExercises(p.exercises||[]);setXp(p.xp||0);setStreak(p.streak||1);setUserName(p.userName||'');setNameDraft(p.userName||'');if(!p.userName)setShowNameModal(true);}else{setShowNameModal(true);}}catch{setShowNameModal(true);}},[]);
 useEffect(()=>{localStorage.setItem('sql-trainer-progress',JSON.stringify({lessons:completedLessons,exercises:completedExercises,xp,streak,userName}));},[completedLessons,completedExercises,xp,streak]);
 useEffect(()=>{(async()=>{try{const SQL=await initSqlJs();const db=new SQL.Database();db.run(seed);dbRef.current=db;setReady(true);setTimeout(()=>run(lessons[0].sql,false),0);}catch(e){setError(true);setMessage(String(e));}})();},[]);
 const currentLesson=lessons.find(l=>l.id===active) || lessons[0];
 const visibleLessons=useMemo(()=>lessons.filter(l=>l.level===level && (l.title+' '+l.module+' '+l.desc).toLowerCase().includes(search.toLowerCase())),[level,search]);
 const visibleExercises=useMemo(()=>exercises.filter(e=>e.level===level && (e.title+' '+e.module+' '+e.prompt).toLowerCase().includes(search.toLowerCase())),[level,search]);
 const totalItems=lessons.length+exercises.length; const completedCount=completedLessons.length+completedExercises.length; const percent=Math.round(completedCount/totalItems*100); const levelProgress=lessons.filter(l=>l.level===level).filter(l=>completedLessons.includes(l.id)).length + exercises.filter(e=>e.level===level).filter(e=>completedExercises.includes(e.id)).length;
 const maxLevelUnlocked= xp>=1000?'Avançado':xp>=450?'Intermediário':'Básico';

 function run(sql=code, award=true){if(!dbRef.current)return;try{const result=dbRef.current.exec(sql);if(result.length){setCols(result[0].columns);setRows(result[0].values.map((v:unknown[])=>Object.fromEntries(result[0].columns.map((c:string,i:number)=>[c,v[i]]))));}else{setCols([]);setRows([]);}setError(false);setMessage(result.length?`${result[0].values.length} linha(s) retornada(s).`:'Comando executado com sucesso.');if(award && !completedLessons.includes(active)){setCompletedLessons(p=>[...p,active]);setXp(x=>x+currentLesson.xp);}}catch(e){setError(true);setMessage(e instanceof Error?e.message:String(e));setRows([]);setCols([]);}}
 function reset(){if(!dbRef.current)return;dbRef.current.close();const SQLPromise=initSqlJs();SQLPromise.then(SQL=>{const db=new SQL.Database();db.run(seed);dbRef.current=db;setRows([]);setCols([]);setError(false);setMessage('Banco restaurado.');setTimeout(()=>run(lessons[0].sql,false),0);});}
 function selectLesson(l:Lesson){setTab('aulas');setActive(l.id);setCode(l.sql);setMessage('Exemplo carregado.');setError(false);setShowLessonHint(false);setMobile(false);setTimeout(()=>run(l.sql,false),0);}
 function checkExercise(ex:Exercise){if(!dbRef.current)return;try{const r=dbRef.current.exec(code);const expected=dbRef.current.exec(ex.expected);const got=JSON.stringify(r.map((x)=>({columns:x.columns,values:x.values})));const exp=JSON.stringify(expected.map((x)=>({columns:x.columns,values:x.values})));if(got===exp){setError(false);setMessage(`🎉 Resposta correta! +${ex.xp} XP`);if(!completedExercises.includes(ex.id)){setCompletedExercises(p=>[...p,ex.id]);setXp(x=>x+ex.xp);}}else{setError(true);setMessage('A consulta executou, mas o resultado não corresponde ao esperado. Use a dica e tente novamente.');}}catch(e){setError(true);setMessage(e instanceof Error?e.message:String(e));}}
 function loadExercise(ex:Exercise){setCode('');setMessage('Escreva sua solução e clique em Corrigir.');setError(false);setRows([]);setCols([]);setActive(ex.id);}
 function saveName(){const name=nameDraft.trim();if(!name)return;setUserName(name);localStorage.setItem('sql-trainer-progress',JSON.stringify({lessons:completedLessons,exercises:completedExercises,xp,streak,userName:name}));setShowNameModal(false);}
 function resetProgress(){localStorage.removeItem('sql-trainer-progress');setCompletedLessons([]);setCompletedExercises([]);setXp(0);setStreak(1);setShowCertificate(false);setShowNameModal(true);}

 return <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
  <header className="h-16 border-b border-[#243149] bg-[#0a101c] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30"><div className="flex items-center gap-3"><button className="md:hidden p-2 rounded-lg bg-[#111b2d]" onClick={()=>setMobile(!mobile)}>{mobile?<X size={19}/>:<Menu size={19}/>}</button><div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center"><DbIcon size={19} className="text-indigo-300"/></div><div><div className="font-bold">SQL Academy</div><div className="text-[11px] text-slate-500">Plataforma de treinamento SQL</div></div></div><div className="flex items-center gap-4"><div className="hidden sm:flex items-center gap-2 text-xs"><Flame size={15} className="text-orange-400"/> {streak} dia(s)</div><div className="hidden sm:block w-36 h-2 bg-[#1b2638] rounded-full overflow-hidden"><div className="h-full bg-indigo-400" style={{width:`${percent}%`}}/></div><div className="text-xs text-indigo-200 font-bold">{xp} XP</div></div></header>
  <div className="flex flex-1 min-h-0 relative">
   <aside className={`${mobile?'absolute inset-y-0 left-0 z-20':'hidden'} md:flex w-80 shrink-0 border-r border-[#243149] bg-[#0a101c] flex-col`}>
    <div className="p-4 border-b border-[#243149]"><div className="flex gap-1 p-1 bg-[#111b2d] rounded-lg mb-3">{(['Básico','Intermediário','Avançado'] as Level[]).map(l=><button key={l} disabled={levelIndex(l)>levelIndex(maxLevelUnlocked)} onClick={()=>setLevel(l)} className={`flex-1 py-1.5 text-[11px] rounded-md ${level===l?'bg-indigo-500 text-white':'text-slate-400'} disabled:opacity-30`}>{l}</button>)}</div><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar conteúdo..." className="w-full bg-[#111b2d] border border-[#263550] rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-400"/></div></div>
    <div className="grid grid-cols-3 gap-1 p-3 border-b border-[#243149]"><button onClick={()=>setTab('aulas')} className={`py-2 rounded-md text-xs ${tab==='aulas'?'bg-indigo-500/15 text-indigo-200':'text-slate-500'}`}><BookOpen size={14} className="mx-auto mb-1"/>Aulas</button><button onClick={()=>setTab('exercicios')} className={`py-2 rounded-md text-xs ${tab==='exercicios'?'bg-indigo-500/15 text-indigo-200':'text-slate-500'}`}><CheckCircle2 size={14} className="mx-auto mb-1"/>Exercícios</button><button onClick={()=>setTab('desafios')} className={`py-2 rounded-md text-xs ${tab==='desafios'?'bg-indigo-500/15 text-indigo-200':'text-slate-500'}`}><Trophy size={14} className="mx-auto mb-1"/>Desafios</button></div>
    <div className="flex-1 overflow-auto p-3 scrollbar">
     {tab === 'aulas' && (
      <>
       {visibleLessons.map(l => (
        <button key={l.id} onClick={() => selectLesson(l)} className={`w-full text-left rounded-lg px-3 py-2.5 mb-1 flex items-center justify-between gap-2 ${active === l.id ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/20' : 'text-slate-400 hover:bg-[#111b2d]'}`}>
         <span>
          <span className="block text-sm font-medium">{l.title}</span>
          <span className="block text-[11px] text-slate-500">{l.module} • +{l.xp} XP</span>
         </span>
         {completedLessons.includes(l.id) ? <CheckCircle2 size={15} className="text-emerald-400" /> : <ChevronRight size={15} className="text-slate-700" />}
        </button>
       ))}
      </>
     )}
     {tab === 'exercicios' && (
      <>
       {visibleExercises.map(e => (
        <button key={e.id} onClick={() => loadExercise(e)} className="w-full text-left rounded-lg px-3 py-3 mb-1 text-slate-400 hover:bg-[#111b2d] flex justify-between">
         <span>
          <span className="block text-sm font-medium">{e.title}</span>
          <span className="block text-[11px] text-slate-500">{e.module} • +{e.xp} XP</span>
         </span>
         {completedExercises.includes(e.id) ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Zap size={15} className="text-amber-400" />}
        </button>
       ))}
      </>
     )}
     {tab === 'desafios' && (
      <div className="space-y-3">
       <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
        <Trophy className="text-amber-300" size={20} />
        <h3 className="font-semibold mt-2">Desafio SQL Master</h3>
        <p className="text-xs text-slate-400 mt-1">Conclua todos os exercícios avançados para liberar o certificado.</p>
        <div className="mt-3 h-2 bg-[#1b2638] rounded-full">
         <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.round(exercises.filter(e => e.level === 'Avançado' && completedExercises.includes(e.id)).length / 2 * 100)}%` }} />
        </div>
       </div>
       <div className="rounded-xl border border-[#243149] p-4">
        <div className="flex gap-2"><ShieldCheck size={18} className="text-emerald-300" /><span className="font-semibold text-sm">Meta de certificação</span></div>
        <p className="text-xs text-slate-500 mt-2">1.000 XP + todos os desafios avançados.</p>
       </div>
      </div>
     )}
    </div>
    <div className="p-3 border-t border-[#243149] space-y-2"><button onClick={()=>setShowCertificate(true)} disabled={xp<1000 || !exercises.filter(e=>e.level==='Avançado').every(e=>completedExercises.includes(e.id))} className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 py-2 text-xs text-emerald-200 disabled:opacity-30"><Award size={14}/> Ver certificado</button><button onClick={reset} className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#2a3852] bg-[#111b2d] py-2 text-xs text-slate-300"><RotateCcw size={14}/> Restaurar banco</button><button onClick={resetProgress} className="w-full text-[10px] text-slate-600 hover:text-slate-400">Zerar progresso</button></div>
   </aside>
   <main className="flex-1 min-w-0 overflow-auto scrollbar"><div className="max-w-[1500px] mx-auto p-4 md:p-6 space-y-4">
    <section className="rounded-2xl border border-[#243149] bg-gradient-to-br from-[#111b2d] to-[#0c1320] p-5 md:p-6"><div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div><div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold mb-2"><GraduationCap size={15}/> FORMAÇÃO PROFISSIONAL</div><h1 className="text-2xl md:text-3xl font-bold">Aprenda SQL do zero ao avançado.</h1><p className="mt-2 text-sm text-slate-400 max-w-2xl">Aulas curtas, laboratório real, correção automática e desafios. Seu progresso fica salvo neste navegador.</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-[#0a101c] border border-[#243149] px-4 py-3"><div className="text-xl font-bold">{percent}%</div><div className="text-[10px] text-slate-500">progresso</div></div><div className="rounded-xl bg-[#0a101c] border border-[#243149] px-4 py-3"><div className="text-xl font-bold">{completedCount}</div><div className="text-[10px] text-slate-500">concluídos</div></div><div className="rounded-xl bg-[#0a101c] border border-[#243149] px-4 py-3"><div className="text-xl font-bold">{levelProgress}</div><div className="text-[10px] text-slate-500">no nível</div></div></div></div></section>
    {tab==='aulas' && <div className="grid xl:grid-cols-[1.05fr_.95fr] gap-4"><section className="rounded-2xl border border-[#243149] bg-[#0d1422] overflow-hidden"><div className="h-12 border-b border-[#243149] flex items-center justify-between px-4"><div className="flex items-center gap-2"><Code2 size={16} className="text-indigo-300"/><span className="font-semibold text-sm">{currentLesson.title}</span></div><span className="text-[11px] text-slate-500">{currentLesson.module} • {currentLesson.level}</span></div><div className="px-4 pt-4"><p className="text-sm text-slate-300">{currentLesson.desc}</p></div><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} className="editor w-full min-h-[330px] bg-[#080d17] p-4 md:p-5 text-sm leading-6 text-slate-200 outline-none resize-y mt-3"/><div className="border-t border-[#243149] p-3 flex flex-wrap gap-2 items-center"><button onClick={()=>run()} disabled={!ready} className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 text-sm font-semibold"><Play size={15} fill="currentColor"/> Executar</button><button onClick={()=>setShowLessonHint(true)} className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200 hover:bg-amber-400/15"><Lightbulb size={15}/> Dica</button><button onClick={()=>{setCode(currentLesson.sql);setTimeout(()=>run(currentLesson.sql,false),0)}} className="px-3 py-2 rounded-lg border border-[#2a3852] text-sm text-slate-300">Recarregar</button></div><div className="px-4 pb-4 pt-1 text-xs text-slate-500">O exemplo desta aula é executado automaticamente ao selecionar a aula, quando o comando puder ser executado no laboratório.</div></section><ResultPanel cols={cols} rows={rows} error={error} message={message}/></div>}
    {tab==='exercicios' && <ExercisePanel exercise={visibleExercises.find(e=>e.id===active) || visibleExercises[0]} code={code} setCode={setCode} check={checkExercise} error={error} message={message} cols={cols} rows={rows} hint={(visibleExercises.find(e=>e.id===active)||visibleExercises[0])?.hint||''}/>} 
    {tab==='desafios' && <ChallengePanel xp={xp} completedExercises={completedExercises} onStart={(e)=>{setTab('exercicios');loadExercise(e)}}/>}
   </div></main>
  </div>
  {showLessonHint && <div className="fixed inset-0 z-[55] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl border border-amber-300/30 bg-[#101827] shadow-2xl overflow-hidden"><div className="flex items-center justify-between px-5 py-4 border-b border-[#243149]"><div className="flex items-center gap-2 font-semibold text-amber-200"><Lightbulb size={18}/> Dica — {currentLesson.title}</div><button onClick={()=>setShowLessonHint(false)} className="p-2 rounded-lg hover:bg-[#1a263a] text-slate-400" aria-label="Fechar"><X size={18}/></button></div><div className="p-5 space-y-5"><div><div className="text-xs uppercase tracking-wider text-amber-300 font-semibold">Como funciona</div><p className="text-sm text-slate-300 mt-2 leading-6">{currentLesson.tip}</p></div><div><div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Comando da aula</div><pre className="mt-2 rounded-xl bg-[#080d17] border border-[#243149] p-4 text-xs text-slate-300 overflow-auto whitespace-pre-wrap">{currentLesson.sql}</pre></div></div><div className="px-5 py-4 border-t border-[#243149] flex justify-end"><button onClick={()=>setShowLessonHint(false)} className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-4 py-2 text-sm font-semibold">Entendi</button></div></div></div>}
  {showCertificate && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
   <div className="certificate w-full max-w-3xl min-h-[680px] rounded-2xl border border-amber-300/30 bg-[#101827] p-10 text-center shadow-2xl flex flex-col justify-between">
    <div><Award size={56} className="mx-auto text-amber-300"/><div className="text-xs tracking-[.3em] text-amber-300 mt-5">CERTIFICADO DE CONCLUSÃO</div><h2 className="text-4xl font-bold mt-4">SQL Academy</h2><p className="text-slate-400 mt-4">Certificamos que</p><div className="text-3xl font-semibold text-white mt-2">{userName}</div><p className="text-slate-400 mt-4 max-w-xl mx-auto leading-6">concluiu a trilha completa de treinamento SQL, demonstrando domínio dos fundamentos, consultas, relacionamentos, manipulação e recursos avançados.</p></div>
    <div><div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mt-8"><div><b className="text-xl">{xp}</b><div className="text-xs text-slate-500">XP conquistado</div></div><div><b className="text-xl">{lessons.length}</b><div className="text-xs text-slate-500">aulas</div></div><div><b className="text-xl">{exercises.length}</b><div className="text-xs text-slate-500">desafios</div></div></div><div className="mt-10 text-sm text-slate-500">SQL Academy • Certificado de conclusão</div></div>
    <div className="no-print flex justify-center gap-2 mt-8"><button onClick={()=>window.print()} className="rounded-lg bg-amber-400 text-slate-950 px-4 py-2 font-semibold">Imprimir / PDF</button><button onClick={()=>setShowCertificate(false)} className="rounded-lg border border-[#2a3852] px-4 py-2">Fechar</button></div>
   </div>
  </div>}
  {showNameModal && <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
   <div className="w-full max-w-md rounded-2xl border border-indigo-400/30 bg-[#101827] shadow-2xl p-6">
    <div className="h-12 w-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-300"><GraduationCap size={24}/></div>
    <h2 className="text-xl font-bold mt-5">Bem-vindo à SQL Academy</h2>
    <p className="text-sm text-slate-400 mt-2 leading-6">Informe seu nome. Ele será usado no certificado de conclusão quando você finalizar a trilha.</p>
    <input autoFocus value={nameDraft} onChange={e=>setNameDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveName();}} placeholder="Digite seu nome completo" className="mt-5 w-full rounded-lg bg-[#0a101c] border border-[#2a3852] px-3 py-3 text-sm outline-none focus:border-indigo-400"/>
    <button onClick={saveName} disabled={!nameDraft.trim()} className="mt-4 w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 px-4 py-3 text-sm font-semibold">Continuar</button>
   </div>
  </div>}
}

function ResultPanel({cols,rows,error,message}:{cols:string[];rows:Row[];error:boolean;message:string}){return <section className="rounded-2xl border border-[#243149] bg-[#0d1422] overflow-hidden"><div className="h-12 border-b border-[#243149] flex items-center justify-between px-4"><div className="flex items-center gap-2"><Table2 size={16} className="text-emerald-300"/><span className="font-semibold text-sm">Resultado</span></div><span className={`text-xs ${error?'text-red-300':'text-slate-500'}`}>{message}</span></div><div className="min-h-[380px] overflow-auto">{error?<div className="m-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex gap-3"><AlertCircle className="text-red-300" size={18}/><div><div className="font-semibold text-red-200">Erro SQL</div><div className="text-sm text-red-200/70 mt-1 font-mono whitespace-pre-wrap">{message}</div></div></div>:cols.length?<table className="w-full text-sm"><thead className="bg-[#111b2d] sticky top-0"><tr>{cols.map(c=><th key={c} className="text-left px-4 py-3 border-b border-[#243149] text-slate-400 font-medium">{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i} className="border-b border-[#1b2638]">{cols.map(c=><td key={c} className="px-4 py-3 text-slate-200 font-mono text-xs">{r[c]===null?<span className="text-slate-600">NULL</span>:String(r[c])}</td>)}</tr>)}</tbody></table>:<div className="h-[380px] flex flex-col items-center justify-center text-slate-500"><Terminal size={28} className="mb-3 opacity-40"/><p className="text-sm">Execute uma consulta para ver os dados.</p></div>}</div></section>}

function ExercisePanel({exercise,code,setCode,check,error,message,hint,cols,rows}:{exercise?:Exercise;code:string;setCode:(v:string)=>void;check:(e:Exercise)=>void;error:boolean;message:string;hint:string;cols:string[];rows:Row[]}){
 const [showHint,setShowHint]=useState(false);
 if(!exercise)return <div className="rounded-2xl border border-[#243149] p-8 text-slate-400">Nenhum exercício encontrado.</div>;
 return <div className="grid xl:grid-cols-[.85fr_1.15fr] gap-4">
  <section className="rounded-2xl border border-[#243149] bg-[#0d1422] p-6">
   <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold"><Zap size={15}/> DESAFIO • +{exercise.xp} XP</div>
   <h2 className="text-2xl font-bold mt-3">{exercise.title}</h2>
   <p className="text-slate-300 text-sm leading-6 mt-4">{exercise.prompt}</p>
   <button onClick={()=>setShowHint(true)} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-200 hover:bg-amber-400/15"><Lightbulb size={16}/> Dica</button>
   <div className="mt-5 text-xs text-slate-500">Escreva a solução no editor e clique em <b className="text-slate-300">Corrigir resposta</b>. A correção compara o resultado da sua consulta com a solução esperada.</div>
  </section>
  <section className="rounded-2xl border border-[#243149] bg-[#0d1422] overflow-hidden">
   <div className="h-12 border-b border-[#243149] flex items-center justify-between px-4"><span className="font-semibold text-sm">Sua solução</span><span className="text-xs text-slate-500">SQLite</span></div>
   <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} placeholder="SELECT ..." className="editor w-full min-h-[270px] bg-[#080d17] p-5 text-sm leading-6 outline-none resize-y"/>
   <div className="border-t border-[#243149] p-3 flex items-center gap-2"><button onClick={()=>check(exercise)} className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-sm font-bold"><Check size={15} className="inline mr-2"/>Corrigir resposta</button></div>
   <div className="px-4 py-3 text-xs border-t border-[#243149]">{error?<span className="text-red-300">{message}</span>:<span className="text-emerald-300">{message}</span>}</div>
   <div className="border-t border-[#243149] max-h-56 overflow-auto"><ResultPanel cols={cols} rows={rows} error={false} message=""/></div>
  </section>
  {showHint && <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
   <div className="w-full max-w-lg rounded-2xl border border-amber-300/30 bg-[#101827] shadow-2xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#243149]"><div className="flex items-center gap-2 font-semibold text-amber-200"><Lightbulb size={18}/> Dica — {exercise.title}</div><button onClick={()=>setShowHint(false)} className="p-2 rounded-lg hover:bg-[#1a263a] text-slate-400" aria-label="Fechar"><X size={18}/></button></div>
    <div className="p-5 space-y-5"><div><div className="text-xs uppercase tracking-wider text-amber-300 font-semibold">Como pensar</div><p className="text-sm text-slate-300 mt-2 leading-6">{hint}</p></div><div><div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Como o comando funciona</div><p className="text-sm text-slate-300 mt-2 leading-6">{exercise.explanation}</p></div></div>
    <div className="px-5 py-4 border-t border-[#243149] flex justify-end"><button onClick={()=>setShowHint(false)} className="rounded-lg bg-indigo-500 hover:bg-indigo-400 px-4 py-2 text-sm font-semibold">Entendi</button></div>
   </div>
  </div>}
 </div>
}
function ChallengePanel({xp,completedExercises,onStart}:{xp:number;completedExercises:string[];onStart:(e:Exercise)=>void}){const advanced=exercises.filter(e=>e.level==='Avançado');return <div className="rounded-2xl border border-[#243149] bg-[#0d1422] p-6"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold text-amber-300 flex gap-2"><Trophy size={15}/> DESAFIO FINAL</div><h2 className="text-2xl font-bold mt-2">SQL Master</h2><p className="text-sm text-slate-400 mt-2 max-w-2xl">Resolva os desafios avançados usando subqueries, CTEs e window functions. Ao atingir 1.000 XP e concluir todos, o certificado é liberado.</p></div><div className="text-right"><div className="text-2xl font-bold">{xp} XP</div><div className="text-xs text-slate-500">meta: 1.000</div></div></div><div className="grid md:grid-cols-2 gap-3 mt-7">{advanced.map(e=>{const done=completedExercises.includes(e.id);return <div key={e.id} className="rounded-xl border border-[#243149] p-4 flex items-center gap-3"><div className={`h-9 w-9 rounded-full flex items-center justify-center ${done?'bg-emerald-400/10 text-emerald-300':'bg-[#111b2d] text-slate-500'}`}>{done?<CheckCircle2 size={18}/>:<Lock size={16}/>}</div><div className="flex-1"><div className="font-semibold text-sm">{e.title}</div><div className="text-[11px] text-slate-500">+{e.xp} XP</div></div><button onClick={()=>onStart(e)} className="text-xs text-indigo-300 hover:text-indigo-200">{done?'Revisar':'Começar'}</button></div>})}</div></div>}
