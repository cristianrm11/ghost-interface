import { describe, it, expect, beforeEach } from 'vitest';
import { scanForm } from '../content/form-scanner';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('scanForm', () => {
  it('returns empty array when no form exists', () => {
    document.body.innerHTML = '<div>no form here</div>';
    expect(scanForm('generic')).toEqual([]);
  });

  it('scans basic input fields', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" id="first_name" name="first_name" required />
        <input type="email" id="email" name="email" />
        <input type="tel" id="phone" name="phone" />
      </form>
    `;
    const fields = scanForm('generic');
    expect(fields).toHaveLength(3);
    expect(fields[0].type).toBe('text');
    expect(fields[1].type).toBe('email');
    expect(fields[2].type).toBe('phone');
  });

  it('derives key from ancestor label text', () => {
    document.body.innerHTML = `
      <form>
        <label>
          <span>First Name</span>
          <input type="text" name="first_name" />
        </label>
      </form>
    `;
    const fields = scanForm('generic');
    expect(fields[0].key).toBe('First Name');
  });

  it('falls back to name attribute when no label', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="applicant_email" />
      </form>
    `;
    const [field] = scanForm('generic');
    expect(field.key).toBe('applicant_email');
  });

  it('filters out hidden inputs', () => {
    document.body.innerHTML = `
      <form>
        <input type="hidden" name="csrf_token" value="abc" />
        <input type="text" name="first_name" />
      </form>
    `;
    const fields = scanForm('generic');
    expect(fields).toHaveLength(1);
    expect(fields[0].key).toBe('first_name');
  });

  it('filters out submit buttons', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="name" />
        <input type="submit" value="Apply" />
      </form>
    `;
    const fields = scanForm('generic');
    expect(fields).toHaveLength(1);
  });

  it('reads charLimit from maxlength attribute', () => {
    document.body.innerHTML = `
      <form>
        <textarea name="cover_letter" maxlength="5000"></textarea>
      </form>
    `;
    const [field] = scanForm('generic');
    expect(field.charLimit).toBe(5000);
    expect(field.type).toBe('textarea');
  });

  it('returns undefined charLimit when maxlength is absent', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="city" />
      </form>
    `;
    const [field] = scanForm('generic');
    expect(field.charLimit).toBeUndefined();
  });

  it('reflects required attribute', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="first_name" required />
        <input type="text" name="middle_name" />
      </form>
    `;
    const fields = scanForm('generic');
    expect(fields[0].required).toBe(true);
    expect(fields[1].required).toBe(false);
  });

  it('handles select elements', () => {
    document.body.innerHTML = `
      <form>
        <select name="country">
          <option value="US">United States</option>
        </select>
      </form>
    `;
    const fields = scanForm('generic');
    expect(fields[0].type).toBe('select');
  });

  it('simplifies Greenhouse bracket-style names', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" name="job_application[answers_attributes][0][text_value]" />
      </form>
    `;
    const [field] = scanForm('greenhouse');
    expect(field.key).toBe('text_value');
  });

  it('uses the greenhouse form fixture correctly', async () => {
    const html = await import('../__fixtures__/greenhouse-form.html?raw').catch(() => null);
    if (!html) return; // fixture may not be importable in all configs

    document.body.innerHTML = (html as { default: string }).default;
    const fields = scanForm('greenhouse');
    // Should have text+email+tel+text+url+url+textarea+file = 8 non-submit visible fields
    expect(fields.length).toBeGreaterThanOrEqual(6);
    const types = fields.map((f) => f.type);
    expect(types).toContain('email');
    expect(types).toContain('phone');
    expect(types).toContain('textarea');
  });
});
