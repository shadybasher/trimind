# הוראות להקמת GitHub Repository

## שלב 1: צור Repository חדש ב-GitHub

1. גש ל-https://github.com/new
2. שם ה-Repository: `trimind-v-next`
3. תיאור (אופציונלי): "Trimind V-Next - Next.js Application with Zero-Error CI/CD Pipeline"
4. Visibility: בחר Private או Public לפי הצורך
5. **אל תאתחל** את ה-Repository עם README, .gitignore או license (כבר יש לנו)
6. לחץ על "Create repository"

## שלב 2: חבר את ה-Repository המקומי ל-GitHub

לאחר יצירת ה-Repository, הרץ את הפקודות הבאות:

```bash
cd c:\2025\trimind-v-next

# החלף את USERNAME בשם המשתמש שלך ב-GitHub
git remote add origin https://github.com/USERNAME/trimind-v-next.git

# בדוק את ה-branch הנוכחי
git branch

# שנה את שם ה-branch ל-main (אם נדרש)
git branch -M main

# דחף את הקוד ל-GitHub
git push -u origin main
```

## שלב 3: אמת שה-CI Pipeline רץ

1. גש ל-Repository ב-GitHub
2. לחץ על הטאב "Actions"
3. צפה בריצה הראשונה של ה-CI
4. וודא שכל השלבים מסומנים בירוק (✓)

## מה צפוי לראות ב-CI Pipeline:

- ✅ Install dependencies
- ✅ Run Linting (ESLint)
- ✅ Check Code Formatting (Prettier)
- ✅ Type Check (TypeScript)
- ✅ Security Audit
- ✅ Build Project
- ✅ Run Tests

כל אחד מהשלבים האלו **חייב** לעבור בהצלחה. אם אחד נכשל, כל ה-Pipeline נכשל.
