import { type ParagraphSizeMap } from './types'

export const PARAGRAPH_SIZES: ParagraphSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  default: 'text-base',
  lg: 'text-lg',
  lead: 'font-inter text-[1.25rem] font-medium leading-[1.75rem] tracking-[-0.01em] ',
  title: 'font-inter text-[1rem] font-medium leading-6 tracking-[-0.01em]',
  body: 'font-inter text-[1rem] font-normal leading-6 tracking-[-0.01em]',
  mono: 'font-dmmono text-[0.75rem] font-normal leading-[1.125rem] tracking-[-0.02em]',
  xsmall:
    'font-inter text-[0.8125rem] font-normal leading-5 tracking-[-0.01em]'
}
