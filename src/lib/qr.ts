/**
 * QR symbol geometry shared by the studio canvas
 *
 * version 4 (33×33 modules) is the smallest standard symbol that still encodes
 * a github profile url at error-correction level H, which is the level the
 * studio targets so styled/overlaid modules stay scannable. the quiet zone is
 * rendered as board padding, not as modules, so it is not part of this count
 */
export const QR_MODULE_COUNT = 33;

