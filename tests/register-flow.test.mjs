import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/app/pages/auth/register.page.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true },
});

function makePage({ schoolsFail = false, localitiesFail = false } = {}) {
  let sent;
  const services = {
    AuthService: { signUp: async (input) => { sent = input; return { needsEmailConfirmation: false }; } },
    LocalityService: { listJujuyLocalities: async () => {
      if (localitiesFail) throw new Error('offline');
      return [{ id: 'locality-1', name: 'Localidad' }];
    } },
    SchoolService: { listActiveSchools: async () => {
      if (schoolsFail) throw new Error('offline');
      return [{ id: 'school-1', locality: 'Otra localidad' }];
    } },
    Router: { navigate: async () => true },
  };
  const signal = (initial) => {
    let value = initial;
    const getter = () => value;
    getter.set = (next) => { value = next; };
    getter.update = (fn) => { value = fn(value); };
    return getter;
  };
  const module = { exports: {} };
  runInNewContext(outputText, {
    module, exports: module.exports,
    require: (name) => {
      if (name === '@angular/core') return { Component: () => (target) => target, inject: (token) => services[token.name], signal };
      if (name === '@angular/router') return { Router: { name: 'Router' }, RouterLink: {} };
      if (name === '@angular/forms') return { FormsModule: {} };
      const className = name.split('/').pop().split(/[.-]/).map((word) => word[0].toUpperCase() + word.slice(1)).join('');
      return { [className]: { name: className } };
    },
    Date,
  });
  return { page: new module.exports.RegisterPage(), sent: () => sent };
}

function completeCommonFields(page) {
  page.name = 'Persona de prueba';
  page.birthDay = '1';
  page.birthMonth = '2';
  page.birthYear = '2000';
  page.updateBirthDate();
  page.email = 'persona@example.com';
  page.password = 'secreto';
  page.toggleWasteSeparation('home');
  page.toggleComposting('none');
}

for (const province of ['Jujuy', 'Otra']) {
  for (const membership of ['jujuy_school', 'other_school', 'no_school']) {
    test(`registro: ${province}, ${membership}`, async () => {
      const { page, sent } = makePage();
      await page.loadRegistrationData();
      completeCommonFields(page);
      page.onProvinceChange(province);
      if (province === 'Jujuy') page.localityId = 'locality-1';
      else page.manualLocality = 'Otra localidad';
      page.onSchoolMembershipChange(membership);
      if (membership === 'jujuy_school') page.schoolId = 'school-1';
      if (membership !== 'no_school') page.schoolRole = 'Estudiante';
      assert.equal(page.canSubmit(), true);
      assert.equal(page.formLoading(), false);
      await page.submit();
      assert.equal(sent().province, province);
      assert.equal(sent().localityId, province === 'Jujuy' ? 'locality-1' : undefined);
      assert.equal(sent().locality, province === 'Otra' ? 'Otra localidad' : '');
      assert.equal(sent().schoolId, membership === 'jujuy_school' ? 'school-1' : undefined);
      assert.equal(sent().schoolRole, membership === 'no_school' ? '' : 'Estudiante');
    });
  }
}

test('al cambiar de opción se descartan los datos escolares que ya no corresponden', async () => {
  const { page } = makePage();
  await page.loadRegistrationData();
  completeCommonFields(page);
  page.localityId = 'locality-1';
  page.schoolId = 'school-1';
  page.schoolRole = 'Docente';
  page.onSchoolMembershipChange('no_school');
  assert.equal(page.schoolId, '');
  assert.equal(page.schoolRole, '');
  assert.equal(page.canSubmit(), true);
  page.onSchoolMembershipChange('other_school');
  assert.equal(page.canSubmit(), false, 'la otra escuela requiere un rol');
  page.schoolRole = 'Docente';
  assert.equal(page.canSubmit(), true);
  page.onSchoolMembershipChange('jujuy_school');
  assert.equal(page.canSubmit(), false, 'una escuela de Jujuy requiere selección');
});

test('cada catálogo carga de forma independiente y las alternativas no dependen del catálogo fallido', async () => {
  const schools = makePage({ schoolsFail: true }).page;
  await schools.loadRegistrationData();
  assert.equal(schools.schoolsError(), true);
  assert.equal(schools.localities().length, 1);
  completeCommonFields(schools);
  schools.localityId = 'locality-1';
  schools.onSchoolMembershipChange('no_school');
  assert.equal(schools.canSubmit(), true);
  assert.equal(schools.formLoading(), false);

  const localities = makePage({ localitiesFail: true }).page;
  await localities.loadRegistrationData();
  assert.equal(localities.localitiesError(), true);
  assert.equal(localities.schools().length, 1);
  completeCommonFields(localities);
  localities.onProvinceChange('Otra');
  localities.manualLocality = 'Otra localidad';
  localities.schoolId = 'school-1';
  localities.schoolRole = 'Docente';
  assert.equal(localities.canSubmit(), true);
  assert.equal(localities.formLoading(), false);
});

test('no envía un formulario incompleto y muestra errores', async () => {
  const { page, sent } = makePage();
  await page.loadRegistrationData();
  await page.submit();
  assert.equal(sent(), undefined);
  assert.equal(page.submitted(), true);
  assert.match(page.error(), /Revisá los campos/);
});
