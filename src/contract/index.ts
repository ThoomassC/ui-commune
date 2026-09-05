/**
 * The colour contract — the part of this library that has to exist first.
 *
 * `portfolio` and `travels_in_world` both carried a comment promising their
 * palettes were identical. Six tokens drifted anyway, and nothing said a word,
 * because a comment is not a guard. These helpers are the guard: they read a
 * token sheet as text, rebuild its three themes, and recompute every ratio the
 * comments claim. A wrong number fails CI on the day it is written.
 *
 * Nothing here imports React, touches the DOM, or opens a file. It is a
 * development dependency, never a runtime one, so it costs a consumer's
 * JavaScript budget exactly zero bytes.
 */

export type { Oklab, RgbaColor } from './color.js';
export {
  MID_GREY_LUMINANCE,
  compositeLayers,
  compositeOver,
  contrastRatio,
  deltaEOklab,
  oklab,
  oklchHue,
  oklchHueDistance,
  parseColor,
  parseRgba,
  relativeLuminance,
  withAlpha,
} from './color.js';

export type { Theme, ThemeName } from './stylesheet.js';
export {
  colourTokens,
  parseCustomProperties,
  parseThemes,
  resolveToken,
  ruleBodies,
  stripComments,
} from './stylesheet.js';
