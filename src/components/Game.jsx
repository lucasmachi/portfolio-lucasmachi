import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { bloqueado } from './collision'

const INTRODUCAO = [
  'hii!',
  'welcome to',
  'uhh...',
  "sorry, i'm a little bit shy right now",
  'I am Lucas Machi and this is my little portfolio world!!',
  'each building was built by me and represents one of my personal projects',
  'feel free to explore it all !!!!',
]

const SOBRE = [
  'me? ',
  "I'm Lucas, a junior fullstack python developer, biologist, and game dev",
]

const EXPLICACAO = [
  'this is Machi Cyber Space, my personal portfolio inside your machine!',
  "I built every single piece of this website, it's all on github",
  "check it out if you'd like",
]

const CONTATO = [
  'you can reach me on my e-mail, linkedin or github',
]

const estiloBotao = {
  display: 'block',
  width: '100%',
  padding: '10px 12px',
  border: '2px solid #73c9ef',
  borderRadius: 0,
  background: '#203544',
  color: '#ffffff',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  textDecoration: 'none',
  boxSizing: 'border-box',
}

function Game({ perfil = 'friend' }) {
  const containerRef = useRef(null)
  const conversaAbertaRef = useRef(false)
  const [conversa, setConversa] = useState(null)

  function mostrarOpcoes() {
    conversaAbertaRef.current = true
    setConversa({ tipo: 'opcoes' })
  }

  function iniciarFalas(falas, destino = 'opcoes') {
    conversaAbertaRef.current = true

    setConversa({
      tipo: 'falas',
      falas,
      indice: 0,
      destino,
    })
  }

  function avancarFala() {
    setConversa((atual) => {
      if (!atual || atual.tipo !== 'falas') return atual

      if (atual.indice < atual.falas.length - 1) {
        return {
          ...atual,
          indice: atual.indice + 1,
        }
      }

      return { tipo: atual.destino }
    })
  }

  function fecharConversa() {
    conversaAbertaRef.current = false
    setConversa(null)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const personagem = perfil === 'recruiter' ? 'recruiter' : 'friend'
    const raio = 3

    let jogador, criador, teclas, mapa, obstaculos, aviso, debug
    let avisoInteracao
    let avisoProjeto

    // Pontos de aproximação em frente às portas e ao arco e flecha.
    // x e y usam as coordenadas do mapa, antes do zoom.
    const projetos = [
      {
        nome: 'PetStyle',
        x: 64,
        y: 232,
        avisoY: 204,
        alcance: 28,
        url: 'https://petstyle-lucasmachi.vercel.app/',
      },
      {
        nome: 'Olist Analytics',
        x: 536,
        y: 344,
        avisoY: 318,
        alcance: 28,
        url: 'https://olist-analytics-lucasmachi.vercel.app/',
      },
      {
        nome: 'PONGPONG',
        x: 104,
        y: 412,
        avisoY: 378,
        alcance: 28,
        url: null, // Colocaremos o endereço aqui depois.
      },
    ]

    // Escolhe a interação mais próxima para E não acionar duas coisas.
    const encontrarInteracao = () => {
      if (!jogador || !criador) return null

      const candidatos = []

      const distanciaLucas = Phaser.Math.Distance.Between(
        jogador.x,
        jogador.y,
        criador.x,
        criador.y
      )

      if (distanciaLucas <= 36) {
        candidatos.push({
          tipo: 'criador',
          distancia: distanciaLucas,
        })
      }

      projetos.forEach((projeto) => {
        const distancia = Phaser.Math.Distance.Between(
          jogador.x,
          jogador.y,
          projeto.x,
          projeto.y
        )

        if (distancia <= projeto.alcance) {
          candidatos.push({
            tipo: 'projeto',
            projeto,
            distancia,
          })
        }
      })

      candidatos.sort((a, b) => a.distancia - b.distancia)

      return candidatos[0] ?? null
    }

    let direcao = 0
    let tempoAndando = 0
    let larguraMapa = 640
    let alturaMapa = 480

    const falhas = []

    // O jogador começa livre para explorar.
    conversaAbertaRef.current = false
    setConversa(null)

    // E, clique no Lucas e clique no aviso abrem a mesma conversa.
    const interagirComCriador = () => {
      if (conversaAbertaRef.current) return

      iniciarFalas(INTRODUCAO)
      avisoInteracao?.setVisible(false)
    }

    const jogo = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      width: Math.max(1, container.clientWidth),
      height: Math.max(1, container.clientHeight),
      backgroundColor: '#89bd69',
      pixelArt: true,
      scale: { mode: Phaser.Scale.RESIZE },

      scene: {
        preload() {
          this.load.on('loaderror', (arquivo) => {
            falhas.push(arquivo.key)
          })

          // Lemos o JSON diretamente, mantendo as posições do Tiled.
          this.load.json('mapa', '/map/cyber_space.tmj')

          this.load.spritesheet('cidade', '/map/tilemap_packed.png', {
            frameWidth: 16,
            frameHeight: 16,
          })

          this.load.spritesheet(
            'personagem',
            `/sprites/spritesheet_${personagem}.png`,
            {
              frameWidth: 16,
              frameHeight: 16,
            }
          )

          this.load.spritesheet(
            'criador',
            '/sprites/spritesheet_creator.png',
            {
              frameWidth: 16,
              frameHeight: 16,
            }
          )
        },

        create() {
          if (falhas.length) {
            conversaAbertaRef.current = false
            setConversa(null)

            this.add.text(
              12,
              12,
              `Falha ao carregar: ${falhas.join(', ')}.\nConfira os arquivos em public/map e public/sprites.`,
              {
                fontSize: '16px',
                color: '#ffffff',
                wordWrap: {
                  width: Math.max(200, this.scale.width - 24),
                },
              }
            )

            return
          }

          mapa = this.cache.json.get('mapa')
          larguraMapa = mapa.width * mapa.tilewidth
          alturaMapa = mapa.height * mapa.tileheight

          obstaculos =
            mapa.layers.find((l) => l.name === 'collisions')?.objects ?? []

          const primeiroGid =
            mapa.tilesets.find(
              (t) =>
                t.source === 'ciber espaco.tsx' ||
                t.name === 'tilemap_packed'
            )?.firstgid ?? 1

          // A camada superior fica acima dos personagens.
          // As outras seguem a ordem do mapa.
          mapa.layers.forEach((camada, ordem) => {
            if (!camada.visible || camada.name === 'collisions') return

            const profundidade =
              camada.name === 'above_tiles' || camada.name === 'above'
                ? 100
                : ordem

            if (camada.type === 'tilelayer') {
              camada.data.forEach((gid, indice) => {
                if (!gid) return

                this.add
                  .image(
                    (indice % camada.width) * 16,
                    Math.floor(indice / camada.width) * 16,
                    'cidade',
                    gid - primeiroGid
                  )
                  .setOrigin(0)
                  .setDepth(profundidade)
                  .setAlpha(camada.opacity ?? 1)
              })
            } else if (camada.type === 'objectgroup') {
              camada.objects.forEach((objeto, indice) => {
                if (!objeto.gid || !objeto.visible) return

                // No Tiled, a referência é o canto inferior esquerdo.
                this.add
                  .image(
                    objeto.x,
                    objeto.y,
                    'cidade',
                    objeto.gid - primeiroGid
                  )
                  .setOrigin(0, 1)
                  .setDisplaySize(objeto.width, objeto.height)
                  .setAngle(objeto.rotation ?? 0)
                  .setDepth(profundidade + indice / 10000)
              })
            }
          })

          jogador = this.add
            .sprite(320, 240, 'personagem', 0)
            .setOrigin(0.5, 1)
            .setDepth(51)

          // Minha posição no mapa: altere os dois números para mover.
          criador = this.add
            .sprite(320, 216, 'criador', 0)
            .setOrigin(0.5, 1)
            .setDepth(50)
            .setInteractive({ useHandCursor: true })

          // PENSAR EM UMA MANEIRA MELHOR PARA A ANIMAÇÃO POSTERIORMENTE!
          // Respiração com os pés fixos.
          this.tweens.add({
            targets: criador,
            scaleY: criador.scaleY * 0.94,
            duration: 1200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
          })

          criador.on('pointerdown', interagirComCriador)

          // Colisão fixa nos pés, independente da respiração.
          obstaculos = [
            ...obstaculos,
            {
              x: criador.x - 5,
              y: criador.y - 6,
              width: 10,
              height: 6,
              rotation: 0,
              visible: true,
            },
          ]

          // Aviso clicável acima do Lucas.
          avisoInteracao = this.add
            .text(criador.x, criador.y - 22, 'E - interact', {
              fontFamily: 'monospace',
              fontSize: '8px',
              resolution: 4,
              color: '#203544',
              backgroundColor: '#9bc4c4',
              padding: { x: 6, y: 4 },
            })
            .setOrigin(0.5, 1)
            .setDepth(200)
            .setVisible(true)
            .setInteractive({ useHandCursor: true })

          avisoInteracao.on('pointerdown', interagirComCriador)

          teclas = this.input.keyboard.addKeys(
            'W,A,S,D,UP,DOWN,LEFT,RIGHT,C,E'
          )

          // Um único aviso é reutilizado para o projeto mais próximo.
          avisoProjeto = this.add
            .text(0, 0, '', {
              fontFamily: 'monospace',
              fontSize: '8px',
              resolution: 4,
              color: '#203544',
              backgroundColor: '#9bc4c4',
              padding: { x: 6, y: 4 },
            })
            .setOrigin(0.5, 1)
            .setDepth(200)
            .setVisible(false)
            .setInteractive({ useHandCursor: true })

          const visitarProjeto = () => {
            if (conversaAbertaRef.current) return

            const interacao = encontrarInteracao()

            if (interacao?.tipo !== 'projeto') return
            if (!interacao.projeto.url) return

            window.open(
              interacao.projeto.url,
              '_blank',
              'noopener,noreferrer'
            )
          }

          // Também permite clicar no aviso que estiver aparecendo.
          avisoProjeto.on('pointerdown', visitarProjeto)

          // Abre o link diretamente no evento do teclado.
          // Segurar E não abre várias abas.
          const aoPressionarE = (evento) => {
            if (evento.code !== 'KeyE' || evento.repeat) return

            const elemento = evento.target

            if (
              elemento instanceof HTMLElement &&
              (elemento.isContentEditable ||
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName))
            ) {
              return
            }

            if (conversaAbertaRef.current) {
              avancarFala()
              return
            }

            const interacao = encontrarInteracao()

            if (!interacao) return

            if (interacao.tipo === 'criador') {
              interagirComCriador()
            } else {
              visitarProjeto()
            }
          }

          // Evita uma tecla de movimento ficar presa ao trocar de aba.
          const soltarTeclas = () => {
            Object.values(teclas).forEach((tecla) => tecla.reset())
          }

          window.addEventListener('keydown', aoPressionarE)
          window.addEventListener('blur', soltarTeclas)

          this.events.once('shutdown', () => {
            window.removeEventListener('keydown', aoPressionarE)
            window.removeEventListener('blur', soltarTeclas)
          })

          const camera = this.cameras.main
          camera.setBounds(0, 0, larguraMapa, alturaMapa)
          camera.startFollow(jogador, true)

          const ajustarCamera = () => {
            camera.setZoom(
              Math.max(
                1,
                Math.min(
                  3,
                  Math.floor(
                    Math.min(
                      this.scale.width / 240,
                      this.scale.height / 180
                    )
                  )
                )
              )
            )
          }

          ajustarCamera()
          this.scale.on('resize', ajustarCamera)

          this.events.once('shutdown', () => {
            this.scale.off('resize', ajustarCamera)
          })

          aviso = this.add
            .text(320, 266, 'Move with WASD or arrow keys', {
              fontFamily: 'monospace',
              fontSize: '10px',
              resolution: 4,
              color: '#203544',
              backgroundColor: '#9bc4c4',
              padding: { x: 6, y: 5 },
            })
            .setOrigin(0.5, 0)
            .setDepth(200)

          // Aperte C para ver as colisões no mapa.
          debug = this.add.graphics().setDepth(300).setVisible(false)
          debug.lineStyle(1, 0xff3050, 0.9)

          obstaculos.forEach((o) => {
            if (o.polygon) {
              debug.strokePoints(
                o.polygon.map((p) => ({
                  x: o.x + p.x,
                  y: o.y + p.y,
                })),
                true
              )
            } else {
              debug.strokeRect(o.x, o.y, o.width, o.height)
            }
          })
        },

        update(_tempo, delta) {
          if (!jogador || !teclas) return

          avisoInteracao.setVisible(!conversaAbertaRef.current)

          // Quem está mais abaixo aparece na frente.
          jogador.setDepth(jogador.y < criador.y ? 49 : 51)

          if (conversaAbertaRef.current) {
            avisoProjeto.setVisible(false)
            tempoAndando = 0
            jogador.setFrame(direcao)
            return
          }

          if (Phaser.Input.Keyboard.JustDown(teclas.C)) {
            debug.setVisible(!debug.visible)
          }

          const interacao = encontrarInteracao()

          if (interacao?.tipo === 'projeto') {
            const projeto = interacao.projeto

            avisoProjeto.setText(
              projeto.url
                ? `E - Interact to visit ${projeto.nome}`
                : `${projeto.nome} - Coming soon`
            )

            // Mantém o texto dentro dos limites horizontais do mapa.
            const metadeLargura = avisoProjeto.width / 2

            avisoProjeto.setPosition(
              Phaser.Math.Clamp(
                projeto.x,
                metadeLargura + 8,
                larguraMapa - metadeLargura - 8
              ),
              projeto.avisoY
            )

            avisoProjeto.setVisible(true)
          } else {
            avisoProjeto.setVisible(false)
          }
          let dx =
            Number(teclas.D.isDown || teclas.RIGHT.isDown) -
            Number(teclas.A.isDown || teclas.LEFT.isDown)

          let dy =
            Number(teclas.S.isDown || teclas.DOWN.isDown) -
            Number(teclas.W.isDown || teclas.UP.isDown)

          if (!dx && !dy) {
            tempoAndando = 0
            jogador.setFrame(direcao)
            return
          }

          direcao = dx < 0 ? 2 : dx > 0 ? 3 : dy < 0 ? 1 : 0

          const distancia = (65 * Math.min(delta, 50)) / 1000
          const norma = Math.hypot(dx, dy)

          dx = (dx / norma) * distancia
          dy = (dy / norma) * distancia

          // Subpassos evitam atravessar colisões estreitas.
          const passos = Math.max(1, Math.ceil(distancia / 0.75))
          const antesX = jogador.x
          const antesY = jogador.y

          for (let i = 0; i < passos; i += 1) {
            const nx = jogador.x + dx / passos

            if (
              !bloqueado(
                nx,
                jogador.y - 3,
                raio,
                obstaculos,
                larguraMapa,
                alturaMapa
              )
            ) {
              jogador.x = nx
            }

            const ny = jogador.y + dy / passos

            if (
              !bloqueado(
                jogador.x,
                ny - 3,
                raio,
                obstaculos,
                larguraMapa,
                alturaMapa
              )
            ) {
              jogador.y = ny
            }
          }

          jogador.setDepth(jogador.y < criador.y ? 49 : 51)

          if (jogador.x !== antesX || jogador.y !== antesY) {
            aviso.setVisible(false)
            tempoAndando += delta

            jogador.setFrame(
              [0, 4, 0, 8][Math.floor(tempoAndando / 140) % 4] + direcao
            )
          } else {
            jogador.setFrame(direcao)
          }
        },
      },
    })

    const observer = new ResizeObserver(() => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        jogo.scale.resize(container.clientWidth, container.clientHeight)
      }
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
      jogo.destroy(true)
    }
  }, [perfil])

  return (
    <div className="game-container" aria-label="Cenário da cidade">
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      />

      {conversa && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 'clamp(8px, 3vw, 24px)',
            boxSizing: 'border-box',
          }}
        >
          <section
            role="dialog"
            aria-label="Conversa com Lucas Machi"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '100%',
              overflowY: 'auto',
              padding: 'clamp(12px, 3vw, 24px)',
              boxSizing: 'border-box',
              border: '4px solid #73c9ef',
              outline: '2px solid #203544',
              background: '#fff2a8',
              color: '#203544',
              boxShadow: '6px 6px 0 #203544',
              fontFamily: "'SuperMarioLike', monospace",
              fontSize: 'clamp(14px, 2vw, 18px)',
              lineHeight: 1.6,
              textAlign: 'left',
              textTransform: 'none',
              letterSpacing: 'normal',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(12px, 3vw, 24px)',
              }}
            >
              <img
                src="/faceset/faceset_creator.png"
                alt="Lucas Machi"
                style={{
                  width: 'clamp(64px, 15vw, 128px)',
                  height: 'auto',
                  flexShrink: 0,
                  imageRendering: 'pixelated',
                  background: '#73c9ef',
                  border: '3px solid #203544',
                  boxSizing: 'border-box',
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                {conversa.tipo === 'falas' && (
                  <>
                    <p
                      aria-live="polite"
                      style={{
                        margin: '0 0 20px',
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {conversa.falas[conversa.indice]}
                    </p>

                    <button
                      type="button"
                      onClick={avancarFala}
                      aria-label="Avançar diálogo"
                      style={{
                        ...estiloBotao,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: 'auto',
                        marginLeft: 'auto',
                      }}
                    >
                      NEXT
                      <svg
                        width="22"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M3 12h17M13 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {conversa.tipo === 'opcoes' && (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={fecharConversa}
                      style={estiloBotao}
                    >
                      I will take a look around
                    </button>

                    <button
                      type="button"
                      onClick={() => iniciarFalas(SOBRE)}
                      style={estiloBotao}
                    >
                      Who are you?
                    </button>

                    <button
                      type="button"
                      onClick={() => iniciarFalas(EXPLICACAO)}
                      style={estiloBotao}
                    >
                      Explain more
                    </button>

                    <button
                      type="button"
                      onClick={() => iniciarFalas(CONTATO, 'contatos')}
                      style={estiloBotao}
                    >
                      Ask for contact
                    </button>
                  </div>
                )}

                {conversa.tipo === 'contatos' && (
                  <>
                    <p style={{ margin: '0 0 12px' }}>
                      where would you like to go?
                    </p>

                    <div style={{ display: 'grid', gap: '8px' }}>
                      <a
                        href="mailto:lucascolafati@gmail.com"
                        style={estiloBotao}
                      >
                        e-mail
                      </a>

                      <a
                        href="https://www.linkedin.com/in/lucas-machi"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={estiloBotao}
                      >
                        linkedin
                      </a>

                      <a
                        href="https://github.com/lucasmachi"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={estiloBotao}
                      >
                        github
                      </a>

                      <button
                        type="button"
                        onClick={fecharConversa}
                        style={estiloBotao}
                      >
                        nevermind, I will explore
                      </button>

                      <button
                        type="button"
                        onClick={mostrarOpcoes}
                        aria-label="Voltar às opções de conversa"
                        style={{
                          ...estiloBotao,
                          width: 'auto',
                          justifySelf: 'end',
                        }}
                      >
                        ↩
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default Game