<script lang="ts">
  /**
   * The FieldWolf mark: a wolf asleep beneath a tree. `ground` is the colour
   * behind the mark; it knocks the wolf out from the trunk.
   */
  interface Props {
    size?: number;
    tree?: string;
    wolf?: string;
    ground?: string;
    title?: string | null;
  }
  let { size = 40, tree = '#6B3FA0', wolf = '#2B1747', ground = '#FFFFFF', title = null }: Props = $props();

  const body = 'M66 172 C62 146 84 128 112 128 C140 128 158 146 154 172 Z';
  const head = 'M30 168 C30 161 40 156 54 153 C64 145 78 141 90 145 C97 149 99 159 97 172 L34 172 C30 172 29 170 30 168 Z';
  const earNear = 'M73 147 L80 133 L87 146 Z';
  const earFar = 'M84 147 L93 135 L97 150 Z';
  const tail = 'M156 164 C154 186 100 188 52 179 C45 178 44 171 52 170 C96 175 134 170 148 152 Z';
</script>

<svg
  viewBox="0 0 210 200"
  width={size}
  height={(size * 200) / 210}
  role={title ? 'img' : 'presentation'}
  aria-label={title ?? undefined}
  aria-hidden={title ? undefined : 'true'}
>
  <g fill={tree} transform="translate(-18 0)">
    <path d="M136 172 C138 140 136 112 138 92 L148 92 C150 112 148 140 152 172 Z" />
    <path d="M140 120 C126 112 112 106 98 104 L99 99 C114 100 129 106 143 114 Z" />
    <path d="M146 114 C158 104 172 98 186 96 L187 101 C174 104 162 110 150 120 Z" />
    <circle cx="143" cy="64" r="42" /><circle cx="96" cy="82" r="30" /><circle cx="190" cy="80" r="28" />
    <circle cx="116" cy="42" r="28" /><circle cx="170" cy="40" r="28" /><circle cx="143" cy="26" r="22" />
  </g>
  <g fill={ground} stroke={ground} stroke-width="6" stroke-linejoin="round">
    <path d={body} /><path d={head} /><path d={earNear} /><path d={earFar} />
  </g>
  <g fill={wolf}><path d={body} /><path d={earFar} /></g>
  <g fill={wolf} stroke={ground} stroke-width="2.5" paint-order="stroke" stroke-linejoin="round">
    <path d={head} /><path d={earNear} />
  </g>
  <path d={tail} fill={wolf} stroke={ground} stroke-width="4" paint-order="stroke" stroke-linejoin="round" />
  <path d="M56 157 Q61 161 67 157" fill="none" stroke={ground} stroke-width="2.6" stroke-linecap="round" />
  <rect x="6" y="171" width="198" height="4" rx="2" fill={wolf} />
</svg>
