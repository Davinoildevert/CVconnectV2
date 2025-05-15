"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECRET_KEY = void 0;
exports.SECRET_KEY = process.env.JWT_SECRET || 'default-key';
if (exports.SECRET_KEY === 'default-key') {
    console.warn('⚠️  Avertissement : SECRET_KEY par défaut utilisée. Pensez à configurer .env !');
}
