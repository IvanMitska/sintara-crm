/**
 * Импорт/экспорт контактов (ТЗ §8.6).
 *  - из файла: expo-document-picker → POST /contacts/import (multipart)
 *  - из телефона: expo-contacts → CSV → POST /contacts/import
 *  - экспорт: GET /contacts/export → файл → expo-sharing
 */
import * as Contacts from 'expo-contacts';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { contactsApi, type ImportResult } from '@/api';

/** Экранирование значения для CSV. */
function csvCell(value: string | undefined): string {
  const v = value ?? '';
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** ArrayBuffer → base64 (для записи бинарного файла экспорта). */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i] ?? 0;
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;
    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < bytes.length ? chars[b3 & 63] : '=';
  }
  return result;
}

/** Импорт из файла CSV/XLSX. Возвращает результат или null (отмена). */
export async function importContactsFromFile(): Promise<ImportResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: [
      'text/csv',
      'text/comma-separated-values',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.[0]) return null;
  const asset = picked.assets[0];
  return contactsApi.importFile({
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'text/csv',
  });
}

/** Кол-во контактов в телефоне с именем (для подтверждения перед импортом). */
export async function countPhoneContacts(): Promise<number | null> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.FirstName],
  });
  return data.filter((c) => c.firstName || c.lastName).length;
}

/** Импорт контактов телефона: формирует CSV и загружает на бэкенд. */
export async function importContactsFromPhone(): Promise<ImportResult | null> {
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') return null;

  const { data } = await Contacts.getContactsAsync({
    fields: [
      Contacts.Fields.FirstName,
      Contacts.Fields.LastName,
      Contacts.Fields.Emails,
      Contacts.Fields.PhoneNumbers,
    ],
  });

  const rows = data
    .filter((c) => c.firstName || c.lastName)
    .map((c) =>
      [
        csvCell(c.firstName ?? c.name ?? ''),
        csvCell(c.lastName ?? ''),
        csvCell(c.emails?.[0]?.email ?? ''),
        csvCell(c.phoneNumbers?.[0]?.number ?? ''),
      ].join(','),
    );
  if (rows.length === 0) return { success: 0, failed: 0, duplicates: 0, errors: [] };

  const csv = ['firstName,lastName,email,phone', ...rows].join('\n');
  const uri = `${FileSystem.cacheDirectory}phone-contacts.csv`;
  await FileSystem.writeAsStringAsync(uri, csv);

  return contactsApi.importFile({
    uri,
    name: 'phone-contacts.csv',
    mimeType: 'text/csv',
  });
}

/** Экспорт контактов в XLSX и шаринг через системный диалог. */
export async function exportContacts(): Promise<boolean> {
  const buffer = await contactsApi.exportRaw();
  const uri = `${FileSystem.cacheDirectory}contacts-${Date.now()}.xlsx`;
  await FileSystem.writeAsStringAsync(uri, toBase64(buffer), {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Экспорт контактов',
  });
  return true;
}
