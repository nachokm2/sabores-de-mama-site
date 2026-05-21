import { motion } from 'framer-motion'
import clsx from 'clsx'

const variants = {
  primary:        'btn-primary',
  'primary-dark': 'btn-primary-dark',
  outline:        'btn-outline',
  'outline-light':'btn-outline-light',
  whatsapp:       'btn-whatsapp',
  icon:           'btn-icon',
}

const sizes = {
  sm: 'text-sm px-5 py-2.5',
  md: 'text-sm',
  lg: 'text-base px-9 py-4',
  xl: 'text-lg px-11 py-5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  href,
  target,
  rel,
  type = 'button',
  disabled,
  ...props
}) {
  const cls = clsx(variants[variant], size !== 'md' && sizes[size], className)

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={cls}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}
