import { ArrowCounterClockwiseIcon, BookmarkSimpleIcon, ChecksIcon } from '@phosphor-icons/react/dist/ssr';
import { resetSaga, setSagaProgress } from '../lib/progress-store';
import type { Saga } from '../lib/schema';
import {
  arcLabel,
  completeAll,
  completion,
  countHidden,
  FORMAT_LABEL,
  progressTo,
  seasonsInOrder,
} from '../lib/spoilers';
import { useShield } from '../lib/use-shield';

interface Props {
  saga: Saga;
}

/**
 * "Tu progreso": por cada entrega, un camino de puntos (uno por arco). Por
 * dentro son radios nativos, así que se recorren con las flechas del teclado.
 */
export default function SavePanel({ saga }: Props) {
  const shield = useShield(saga);
  const hidden = countHidden(saga, shield);
  const percent = completion(saga, shield.progress);
  const remaining = hidden.events + hidden.characters + hidden.relations + hidden.reveals;
  const fresh = shield.enabled && percent === 0;

  const update = (seasonId: string, value: number) =>
    setSagaProgress(saga.id, progressTo(saga, shield.progress, seasonId, value));

  return (
    <section className={`save${fresh ? ' is-fresh' : ''}`} aria-labelledby="progreso-titulo" id="progreso">
      <header className="save__head">
        <BookmarkSimpleIcon className="icon save__icon" aria-hidden="true" weight="duotone" />
        <div>
          <h2 id="progreso-titulo">{fresh ? '¿Hasta dónde viste?' : 'Tu progreso'}</h2>
          <p className="save__hint">
            {fresh
              ? 'Toca el último arco que terminaste; lo anterior se marca solo. Lo que sigue queda sin revelar.'
              : `${percent}% de la serie recorrido`}
          </p>
        </div>
      </header>

      <ol className="save__seasons">
        {seasonsInOrder(saga).map((season) => {
          const value = shield.progress[season.id] ?? 0;
          const name = `progreso-${saga.id}-${season.id}`;
          const current =
            value === 0
              ? 'Aún sin ver'
              : value === season.arcs.length
                ? 'Terminada'
                : `Último terminado: ${arcLabel(season, value - 1, shield)}`;
          return (
            <li key={season.id} className="save__season">
              <div className="save__title">
                <span>{season.title}</span>
                <span className="save__year" aria-hidden="true">
                  {FORMAT_LABEL[season.format]}{season.optional ? ', opcional' : ''}, {season.year}
                </span>
              </div>
              <div role="radiogroup" aria-label={season.title} className="save__path">
                {[0, ...season.arcs.map((_, i) => i + 1)].map((n) => {
                  const label =
                    n === 0
                      ? 'Sin ver'
                      : `Terminé: ${arcLabel(season, n - 1, shield)}`;
                  const state = n === 0 ? 'start' : n <= value ? 'lit' : 'dark';
                  return (
                    <label key={n} className={`save__node is-${state}`} title={label}>
                      <input
                        type="radio"
                        name={name}
                        value={n}
                        checked={value === n}
                        onChange={() => update(season.id, n)}
                        aria-label={label}
                      />
                      <span aria-hidden="true" />
                    </label>
                  );
                })}
              </div>
              <p className="save__current" aria-live="polite">
                {current}
              </p>
            </li>
          );
        })}
      </ol>

      <p className="save__status" aria-live="polite">
        {!shield.enabled
          ? 'Escudo apagado: estás viendo toda la historia.'
          : remaining === 0
            ? 'Ya viste toda la serie. No queda nada por revelar.'
            : `Te quedan ${remaining} cosas por descubrir.`}
      </p>

      <div className="save__actions">
        <button type="button" className="btn btn--sm" onClick={() => setSagaProgress(saga.id, completeAll(saga))}>
          <ChecksIcon className="icon" aria-hidden="true" weight="bold" />
          Ya vi todo
        </button>
        <button type="button" className="btn btn--sm" onClick={() => resetSaga(saga.id)}>
          <ArrowCounterClockwiseIcon className="icon" aria-hidden="true" weight="bold" />
          Reiniciar
        </button>
      </div>
    </section>
  );
}
