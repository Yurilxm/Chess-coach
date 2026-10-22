import { useMemo, useState } from 'react'
import { BookOpen, GraduationCap, CheckCircle2, ArrowLeft, ChevronRight, Swords, Shield, Crown, Target, Flag } from 'lucide-react'
import { useAcademy } from '../hooks/useAcademy'
import { useAcademyProgress } from '../hooks/useAcademyProgress'

const LEVEL_INFO = {
  beginner: {
    title: 'Iniciante',
    desc: 'Aprenda as regras, como as peças se movem e os primeiros conceitos.',
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300',
    icon: Flag
  },
  intermediate: {
    title: 'Intermediário',
    desc: 'Aprenda táticas, aberturas e como criar planos de jogo.',
    color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300',
    icon: Target
  },
  advanced: {
    title: 'Avançado',
    desc: 'Aprofunde-se em estratégia complexa, finais e estruturas de peões.',
    color: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-300',
    icon: Crown
  }
}

const CATEGORY_INFO = {
  fundamentos: { title: 'Fundamentos', icon: Shield, desc: 'Regras básicas e movimentos.' },
  taticas: { title: 'Táticas', icon: Swords, desc: 'Golpes táticos e combinações.' },
  aberturas: { title: 'Aberturas', icon: BookOpen, desc: 'Primeiros lances e planos de abertura.' },
  estrategia: { title: 'Estratégia', icon: Target, desc: 'Planos de longo prazo e posicionamento.' },
  finais: { title: 'Finais', icon: Crown, desc: 'Como converter vantagens no final de jogo.' }
}

function AcademyView({ onOpenLesson }) {
  const { lessons } = useAcademy()
  const progress = useAcademyProgress()
  
  const [activeLevel, setActiveLevel] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  const levelsData = useMemo(() => {
    return ['beginner', 'intermediate', 'advanced'].map(levelKey => {
      const items = lessons.filter(l => l.level === levelKey)
      const concluidas = items.filter(l => progress.getLessonProgress(l.id)?.completed).length
      return {
        key: levelKey,
        ...LEVEL_INFO[levelKey],
        total: items.length,
        concluidas
      }
    })
  }, [lessons, progress])

  const categoriesData = useMemo(() => {
    if (!activeLevel) return []
    const itemsLevel = lessons.filter(l => l.level === activeLevel)
    const cats = [...new Set(itemsLevel.map(l => l.category))]
    return cats.map(catKey => {
      const items = itemsLevel.filter(l => l.category === catKey)
      const concluidas = items.filter(l => progress.getLessonProgress(l.id)?.completed).length
      return {
        key: catKey,
        ...(CATEGORY_INFO[catKey] || { title: catKey, icon: BookOpen, desc: '' }),
        total: items.length,
        concluidas
      }
    })
  }, [lessons, activeLevel, progress])

  const filteredLessons = useMemo(() => {
    if (!activeLevel || !activeCategory) return []
    return lessons
      .filter(l => l.level === activeLevel && l.category === activeCategory)
      .sort((a, b) => (a.order || 99) - (b.order || 99))
  }, [lessons, activeLevel, activeCategory])

  // 1. Tela de Categorias
  if (activeLevel && !activeCategory) {
    const lvlInfo = LEVEL_INFO[activeLevel]
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setActiveLevel(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Nível {lvlInfo.title}</h2>
            <p className="text-sm text-slate-400">Escolha uma categoria de estudo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoriesData.map(cat => {
            const Icon = cat.icon
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="text-left rounded-2xl bg-slate-900/60 border border-white/10 hover:border-violet-500/30 hover:bg-slate-900/80 transition-all p-5 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-violet-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">{cat.title}</h3>
                  <p className="text-xs text-slate-400">{cat.desc}</p>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono">{cat.concluidas} / {cat.total} lições</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-300 transition-colors" />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 2. Tela de Lições
  if (activeLevel && activeCategory) {
    const catInfo = CATEGORY_INFO[activeCategory] || { title: activeCategory }
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setActiveCategory(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">{catInfo.title}</h2>
            <p className="text-sm text-slate-400">Nível {LEVEL_INFO[activeLevel].title}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filteredLessons.map((lesson) => {
            const concluida = progress.getLessonProgress(lesson.id)?.completed
            return (
              <button
                key={lesson.id}
                onClick={() => onOpenLesson(lesson)}
                className="w-full text-left rounded-2xl bg-slate-900/60 border border-white/10 hover:border-violet-500/30 hover:bg-slate-900/80 transition-all p-4 flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-violet-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm group-hover:text-violet-200 transition-colors">
                      {lesson.title}
                    </h3>
                    {concluida && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{lesson.objective}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 3. Tela de Níveis
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-8 h-8 text-violet-400" />
          <h2 className="text-3xl font-bold text-white">Academia de Xadrez</h2>
        </div>
        <p className="text-slate-400 max-w-lg mx-auto">
          Escolha um nível para começar seus estudos. Todo o conteúdo é gratuito e offline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {levelsData.map((lvl) => {
          const Icon = lvl.icon
          return (
            <button
              key={lvl.key}
              onClick={() => setActiveLevel(lvl.key)}
              className={`relative overflow-hidden text-left rounded-3xl bg-gradient-to-br ${lvl.color} p-6 border shadow-xl hover:scale-[1.02] transition-all cursor-pointer flex flex-col h-full`}
            >
              <Icon className="w-10 h-10 mb-4 opacity-80" />
              <h3 className="text-xl font-bold mb-2">{lvl.title}</h3>
              <p className="text-xs opacity-80 mb-6 leading-relaxed flex-1">{lvl.desc}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="text-sm font-semibold">
                  {lvl.concluidas} / {lvl.total} <span className="opacity-60 text-xs">lições</span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </div>
              
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                <div className="h-full bg-white/60" style={{ width: `${(lvl.concluidas / Math.max(lvl.total, 1)) * 100}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AcademyView
