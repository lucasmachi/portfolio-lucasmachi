import { useRef, useState } from 'react'
import './App.css'
import Game from './components/Game'

const personagens = [
  {
    id: 'recruiter',
    nome: 'Recruiter',
    texto: 'I am a recruiter',
    imagem: '/faceset/faceset_recruiter.png',
  },
  {
    id: 'friend',
    nome: 'Friend',
    texto: 'i am friend',
    imagem: '/faceset/faceset_friend.png',
  },
]

const tituloMusica = 'Song: MORTE aos biscoitos! - Lucas Machi'

function App() {
  const [perfil, setPerfil] = useState('')
  const [iniciou, setIniciou] = useState(false)
  const [silenciado, setSilenciado] = useState(false)
  const [erroAudio, setErroAudio] = useState('')

  const audioRef = useRef(null)
  const aventuraRef = useRef(null)
  const escolhaRef = useRef(null)

  function iniciarAventura() {
    if (!perfil) return

    const audio = audioRef.current

    if (audio) {
      audio.volume = 0.3
      setErroAudio('')

      audio.play().catch(() => {
        setErroAudio('Music could not start. Use the player to try again.')
      })
    }

    setIniciou(true)
    requestAnimationFrame(() => aventuraRef.current?.focus())
  }

  function voltar() {
    setIniciou(false)
    requestAnimationFrame(() => escolhaRef.current?.focus())
  }

  return (
    <main className={`portfolio-shell${iniciou ? ' is-playing' : ''}`}>
      <audio
        ref={audioRef}
        loop
        muted={silenciado}
        controls={Boolean(erroAudio)}
        preload="metadata"
      >
        <source src="/audio/pongmainmenu.wav" type="audio/wav" />
        Your browser does not support audio playback.
      </audio>

      {!iniciou && (
        <header className="portfolio-header">
          <h1 className="portfolio-title">
            <span>Machi</span>{' '}
            <span>Cyber</span>{' '}
            <span>Space</span>
          </h1>

          <p className="eyebrow">A portfolio adventure</p>

          <p className="subtitle">
            pick a role. thank you for coming =)
          </p>
        </header>
      )}

      {iniciou ? (
        <section
          className="patch-panel adventure-panel"
          aria-label="Your adventure"
          ref={aventuraRef}
          tabIndex={-1}
        >
          <div className="game-toolbar">
            <button
              className="stitched-button back-button"
              type="button"
              onClick={voltar}
              aria-label="Back to character selection"
            >
              {'< BACK'}
            </button>
          </div>

          {/* Envia a escolha para carregar o sprite correto. */}
          <Game key={perfil} perfil={perfil} />
        </section>
      ) : (
        <section
          className="patch-panel selection-panel"
          aria-labelledby="choose-title"
        >
          <h2 id="choose-title" ref={escolhaRef} tabIndex={-1}>
            Choose your character
          </h2>

          <div className="character-options">
            {personagens.map((personagem) => (
              <button
                key={personagem.id}
                type="button"
                className={`character-button character-${personagem.id}`}
                onClick={() => setPerfil(personagem.id)}
                aria-pressed={perfil === personagem.id}
              >
                <span className="portrait-patch">
                  <img
                    className="character-face"
                    src={personagem.imagem}
                    alt=""
                    width="152"
                    height="152"
                  />
                </span>

                <span className="character-label">
                  {personagem.texto}
                </span>

                <span className="selection-marker" aria-hidden="true">
                  {personagem.id === 'friend'
                    ? '"choose meee!!!!"'
                    : perfil === personagem.id
                      ? '✓ Selected'
                      : '"Choose me"'}
                </span>
              </button>
            ))}
          </div>

          <p className="selection-status" aria-live="polite">
            {perfil
              ? `You chose: ${
                  personagens.find(
                    (personagem) => personagem.id === perfil
                  ).nome
                }`
              : 'Choose an option to start the adventure.'}
          </p>

          <button
            type="button"
            className="stitched-button start-button"
            disabled={!perfil}
            onClick={iniciarAventura}
          >
            Start adventure <span aria-hidden="true">→</span>
          </button>
        </section>
      )}

      <div className="audio-settings">
        <button
          className="stitched-button sound-button"
          type="button"
          onClick={() => setSilenciado((atual) => !atual)}
          aria-pressed={silenciado}
          aria-label={silenciado ? 'Unmute music' : 'Mute music'}
          title={silenciado ? 'Unmute music' : 'Mute music'}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M11 5 6 9H3v6h3l5 4Z" />

            {silenciado ? (
              <path d="m16 9 5 6m0-6-5 6" />
            ) : (
              <>
                <path d="M15 8a6 6 0 0 1 0 8" />
                <path d="M18 5a10 10 0 0 1 0 14" />
              </>
            )}
          </svg>
        </button>

        <div className="mini-player" title={tituloMusica}>
          <span className="music-note" aria-hidden="true">
            ♫
          </span>

          <div className="track-info">
            {/* Uma única leitura do título para leitores de tela. */}
            <span className="visually-hidden">{tituloMusica}</span>

            {/* Duas cópias visuais permitem uma rolagem contínua. */}
            <div className="track-marquee" aria-hidden="true">
              <div className="track-marquee-content">
                <span className="track-title">{tituloMusica}</span>
                <span className="track-title">{tituloMusica}</span>
              </div>
            </div>
          </div>

          <span className="track-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>

      {erroAudio && (
        <p className="audio-error" role="alert">
          {erroAudio}
        </p>
      )}
    </main>
  )
}

export default App