import withComma from "./with-comma";


test('dd', () => {
    expect(withComma('0.001')).toBe('0.001')
    expect(withComma('0.000')).toBe('0.000')
    expect(withComma('0.00')).toBe('0.00')
    expect(withComma('0.0')).toBe('0.0')
    expect(withComma('0.')).toBe('0.')
    expect(withComma('0')).toBe('0')
})
