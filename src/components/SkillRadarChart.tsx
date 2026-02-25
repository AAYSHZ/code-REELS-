import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillRadarChartProps {
  skillPoints: { dsa: number; webdev: number; aiml: number; hardware: number };
}

export default function SkillRadarChart({ skillPoints }: SkillRadarChartProps) {
  const data = [
    { subject: 'DSA', value: skillPoints.dsa, fullMark: 1000 },
    { subject: 'Web Dev', value: skillPoints.webdev, fullMark: 1000 },
    { subject: 'AI-ML', value: skillPoints.aiml, fullMark: 1000 },
    { subject: 'Hardware', value: skillPoints.hardware, fullMark: 1000 },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="hsl(0 0% 100% / 0.1)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(0 0% 67%)', fontSize: 12 }} />
        <PolarRadiusAxis tick={false} axisLine={false} />
        <Radar
          name="Skills"
          dataKey="value"
          stroke="hsl(165 100% 42%)"
          fill="hsl(165 100% 42%)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
