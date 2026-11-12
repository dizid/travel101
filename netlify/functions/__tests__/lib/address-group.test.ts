import { describe, it, expect } from 'vitest'
import { addressGroup } from '../../lib/rate-limit.mts'

// Per-address limits group IPv6 callers by their /64 network (T-0571).
describe('addressGroup', () => {
  it('keeps IPv4 addresses as they are', () => {
    expect(addressGroup('203.0.113.7')).toBe('203.0.113.7')
    expect(addressGroup('unknown')).toBe('unknown')
  })

  it('turns an IPv4-mapped IPv6 address into the IPv4 address', () => {
    expect(addressGroup('::ffff:203.0.113.7')).toBe('203.0.113.7')
  })

  it('groups full and compressed IPv6 addresses by /64', () => {
    expect(addressGroup('2001:0db8:abcd:0012:0000:0000:0000:0001')).toBe('2001:db8:abcd:12::/64')
    expect(addressGroup('2001:db8:abcd:12::1')).toBe('2001:db8:abcd:12::/64')
    expect(addressGroup('2001:db8:abcd:12:ffff:1:2:3')).toBe('2001:db8:abcd:12::/64')
    expect(addressGroup('2001:DB8::1')).toBe('2001:db8:0:0::/64')
    expect(addressGroup('fe80::1%eth0')).toBe('fe80:0:0:0::/64')
  })

  it('puts two addresses of one /64 in the same group and other networks apart', () => {
    expect(addressGroup('2001:db8:abcd:12::1')).toBe(addressGroup('2001:db8:abcd:12:9:9:9:9'))
    expect(addressGroup('2001:db8:abcd:12::1')).not.toBe(addressGroup('2001:db8:abcd:13::1'))
  })

  it('leaves anything unparseable unchanged', () => {
    expect(addressGroup('not:an:ip')).toBe('not:an:ip')
  })
})
