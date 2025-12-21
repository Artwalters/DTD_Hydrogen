# Project Regels

## Styling

- Gebruik **alleen `em`** voor alle CSS waarden (margins, paddings, font-sizes, widths, etc.)
- **Nooit `rem` of `px`** gebruiken voor schaalbare waarden
- Uitzondering: Osmo scaling system breakpoints in `reset.css` mogen `px` blijven
- Dit project gebruikt het Osmo fluid scaling system - alles schaalt automatisch mee met de viewport

## Git

- **Nooit pushen naar GitHub** tenzij expliciet gevraagd door de gebruiker
- Commits alleen maken wanneer gevraagd

## CSS Structuur

- Global styles staan in `app/styles/reset.css` en `app/styles/app.css`
- Scaling system variabelen staan in `reset.css`
- Container utility classes staan in `app.css`

## Breakpoints (Osmo)

- Desktop: > 991px
- Tablet: 768px - 991px
- Mobile Landscape: 480px - 767px
- Mobile Portrait: 320px - 479px
