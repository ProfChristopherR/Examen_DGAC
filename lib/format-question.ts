/**
 * Formatea el texto de una pregunta para que numerales romanos (I., II., III., etc.)
 * y numerales arábigos seguidos de punto aparezcan en líneas separadas.
 */
export function formatQuestionText(text: string): string {
  if (!text) return ''

  // Detecta numerales romanos seguidos de punto/espacio: I. II. III. IV. V. VI. VII. VIII. IX. X.
  // Usa una regex que busca estos patrones cuando aparecen en medio de texto
  const romanNumeralPattern = /(\s+)(I{1,3}|IV|V|VI{0,3}|IX|X)\./g

  // Detecta numerales arábigos seguidos de punto cuando están en medio del texto (no al inicio)
  const arabicNumeralPattern = /(\s+)([2-9]|\d{2,})\.(?![\d])/g

  // Primero, reemplaza numerales romanos con salto de línea
  let formatted = text.replace(romanNumeralPattern, '\n$2.')

  // Luego, reemplaza numerales arábigos si es necesario (solo si no son parte de una fecha u hora)
  // Pero de forma conservadora, solo cuando parecen ser lista
  formatted = formatted.replace(arabicNumeralPattern, '\n$2.')

  // Limpia múltiples saltos de línea
  formatted = formatted.replace(/\n{2,}/g, '\n')

  return formatted.trim()
}

/**
 * Convierte el texto formateado en un array de líneas para renderizar con <br />
 */
export function splitQuestionLines(text: string): string[] {
  const formatted = formatQuestionText(text)
  return formatted.split('\n').map(line => line.trim()).filter(Boolean)
}
