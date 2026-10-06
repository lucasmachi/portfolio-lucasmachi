//colisão circular nos pés contra os retângulos e polígonos
export function bloqueado(x, y, raio, objetos, largura, altura) {
  if (x < raio || y < raio || x > largura - raio || y > altura - raio) return true
  return objetos.some((o) => {
    const pontos = o.polygon
      ? o.polygon.map((p) => ({ x: o.x + p.x, y: o.y + p.y }))
      : [{ x: o.x, y: o.y }, { x: o.x + o.width, y: o.y },
        { x: o.x + o.width, y: o.y + o.height }, { x: o.x, y: o.y + o.height }]
    let dentro = false
    for (let i = 0, j = pontos.length - 1; i < pontos.length; j = i++) {
      const a = pontos[j], b = pontos[i]
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) dentro = !dentro
      const dx = b.x - a.x, dy = b.y - a.y
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)))
      if ((x - a.x - t * dx) ** 2 + (y - a.y - t * dy) ** 2 <= raio ** 2) return true
    }
    return dentro
  })
}
